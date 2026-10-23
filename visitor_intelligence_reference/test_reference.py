from datetime import datetime, timedelta, timezone
from dataclasses import replace
from pathlib import Path
import json
import sqlite3
import unittest
from uuid import uuid5, NAMESPACE_URL
from reference import Context, Engine, Grant, Proof, Rejected

T = datetime(2026, 10, 23, 9, tzinfo=timezone.utc)

def event(n, name="page_view", props=None, occurred=None):
    r = {"schema_version": "1.0", "event_id": str(uuid5(NAMESPACE_URL, f"synthetic:{n}")),
         "event_name": name, "properties": props or {"content_id": "case_store"}}
    if occurred is not None:
        r["occurred_at"] = occurred.isoformat()
    return r

class CoreTests(unittest.TestCase):
    def setUp(self):
        self.e = Engine()
        self.c = Context("site_demo", "web", "epoch_A", "session_A", "grant_A")
        self.e.sources = {("site_demo", "web"): "browser", ("site_demo", "booking"): "provider"}
        self.e.grants["grant_A"] = Grant("site_demo", "epoch_A", T, T + timedelta(days=22),
                                        frozenset({"journey", "linking"}), frozenset({"web", "booking"}))

    def start(self):
        self.e.ingest(event(1), self.c, T)

    def proof(self, kind="explicit_contact_link", session="session_A", ids=None):
        p = Proof("proof_A", "site_demo", "grant_A", session, "contact_A",
                  frozenset(ids or {event(1)["event_id"]}), kind, T + timedelta(days=1))
        self.e.proofs[p.proof_id] = p
        return p

    def test_start_and_fixed_window(self):
        self.start()
        w = self.e.windows[("site_demo", "epoch_A")]
        self.assertEqual(w["ends_at"], T + timedelta(days=15))
        self.assertEqual(w["expires_at"], T + timedelta(days=22))

    def test_missing_permission(self):
        with self.assertRaises(Rejected):
            self.e.ingest(event(1), replace(self.c, grant_id="missing"), T)

    def test_denied_purpose(self):
        self.e.grants["grant_A"].purposes = frozenset()
        with self.assertRaises(Rejected): self.start()

    def test_unknown_source(self):
        with self.assertRaises(Rejected):
            self.e.ingest(event(1), replace(self.c, source_id="unknown"), T)

    def test_tenant_boundary(self):
        with self.assertRaises(Rejected):
            self.e.ingest(event(1), replace(self.c, site_id="other"), T)

    def test_unknown_schema(self):
        r = event(1); r["schema_version"] = "2"
        with self.assertRaises(Rejected): self.e.ingest(r, self.c, T)

    def test_no_raw_email_in_event(self):
        r = event(1); r["properties"]["email"] = "synthetic@example.invalid"
        with self.assertRaises(Rejected): self.e.ingest(r, self.c, T)

    def test_no_gender_property(self):
        r = event(1); r["properties"]["gender"] = "not_collected"
        with self.assertRaises(Rejected): self.e.ingest(r, self.c, T)

    def test_content_allowlist(self):
        with self.assertRaises(Rejected):
            self.e.ingest(event(1, props={"content_id": "/secret?token=x"}), self.c, T)

    def test_duplicate_once(self):
        self.start()
        self.assertEqual(self.e.ingest(event(1), self.c, T + timedelta(seconds=1)), "duplicate")
        self.assertEqual(len(self.e.events), 1)

    def test_duplicate_conflict(self):
        self.start()
        with self.assertRaises(Rejected):
            self.e.ingest(event(1, props={"content_id": "about"}), self.c, T)

    def test_day_15_excluded(self):
        self.start()
        with self.assertRaises(Rejected): self.e.ingest(event(2), self.c, T + timedelta(days=15))

    def test_browser_cannot_backdate(self):
        self.start()
        with self.assertRaises(Rejected):
            self.e.ingest(event(2, occurred=T + timedelta(days=1)), self.c, T + timedelta(days=15))

    def test_late_provider_allowed(self):
        self.start()
        r = event(2, "booking_confirmed", {"booking_state": "confirmed"}, T + timedelta(days=14))
        self.assertEqual(self.e.ingest(r, replace(self.c, source_id="booking"), T + timedelta(days=16)), "accepted")

    def test_provider_too_late(self):
        self.start()
        r = event(2, "booking_confirmed", {"booking_state": "confirmed"}, T + timedelta(days=13))
        with self.assertRaises(Rejected): self.e.ingest(r, replace(self.c, source_id="booking"), T + timedelta(days=16))

    def test_provider_future_time(self):
        self.start()
        r = event(2, "booking_confirmed", {"booking_state": "confirmed"}, T + timedelta(days=2))
        with self.assertRaises(Rejected): self.e.ingest(r, replace(self.c, source_id="booking"), T + timedelta(days=1))

    def test_provider_cannot_start_window(self):
        r = event(2, "booking_confirmed", {"booking_state": "confirmed"}, T)
        with self.assertRaises(Rejected): self.e.ingest(r, replace(self.c, source_id="booking"), T)

    def test_no_naive_time(self):
        with self.assertRaises(Rejected): self.e.ingest(event(1), self.c, T.replace(tzinfo=None))

    def test_abstain_one_page(self):
        self.start()
        self.assertIsNone(self.e.infer("site_demo", "epoch_A", T))

    def test_explainable_rule(self):
        self.start()
        self.e.ingest(event(2, props={"content_id": "case_booking"}), self.c, T + timedelta(minutes=1))
        self.e.ingest(event(3, "cta_click", {"cta_id": "project_brief"}), self.c, T + timedelta(minutes=2))
        r = self.e.infer("site_demo", "epoch_A", T + timedelta(minutes=3))
        self.assertEqual(r["entity_scope"], "browser_epoch")
        self.assertIsNone(r["confidence"])
        self.assertEqual(len(r["evidence_ids"]), 3)

    def test_repeated_same_case_not_two_cases(self):
        self.start()
        self.e.ingest(event(2), self.c, T + timedelta(minutes=1))
        self.e.ingest(event(3, "cta_click", {"cta_id": "project_brief"}), self.c, T + timedelta(minutes=2))
        self.assertIsNone(self.e.infer("site_demo", "epoch_A", T + timedelta(minutes=3)))

    def test_explicit_scoped_link(self):
        self.start(); self.proof()
        link = self.e.link_session_to_contact(self.c, "proof_A", T)
        self.assertEqual(link["event_ids"], [event(1)["event_id"]])

    def test_network_not_person_proof(self):
        self.start(); self.proof(kind="same_ip")
        with self.assertRaises(Rejected): self.e.link_session_to_contact(self.c, "proof_A", T)

    def test_wrong_session_proof(self):
        self.start(); self.proof(session="different")
        with self.assertRaises(Rejected): self.e.link_session_to_contact(self.c, "proof_A", T)

    def test_out_of_scope_event_proof(self):
        self.start(); self.proof(ids={event(99)["event_id"]})
        with self.assertRaises(Rejected): self.e.link_session_to_contact(self.c, "proof_A", T)

    def test_reverse_link(self):
        self.start(); self.proof()
        self.e.link_session_to_contact(self.c, "proof_A", T)
        self.e.reverse_link("proof_A", T + timedelta(hours=1))
        self.assertIsNotNone(self.e.links["proof_A"]["revoked_at"])

    def test_withdrawal_purge_and_replay_block(self):
        self.start(); self.proof()
        self.e.link_session_to_contact(self.c, "proof_A", T)
        self.e.withdraw(self.c, T + timedelta(days=3))
        self.assertFalse(self.e.events); self.assertFalse(self.e.links); self.assertFalse(self.e.proofs)
        self.assertIsNone(self.e.infer("site_demo", "epoch_A", T + timedelta(days=4)))
        with self.assertRaises(Rejected): self.e.ingest(event(2), self.c, T + timedelta(days=4))

    def test_deletion_job_retries_until_verified(self):
        self.start()
        self.e.exports.append({"site_id": "site_demo", "epoch_id": "epoch_A", "destination": "mock", "remote_ref": "remote_A"})
        self.e.withdraw(self.c, T + timedelta(days=3))
        self.e.run_deletion_jobs(lambda _: False)
        job = next(iter(self.e.deletion_jobs.values()))
        self.assertEqual(job["state"], "pending")
        self.e.run_deletion_jobs(lambda _: True)
        self.assertEqual(job["state"], "completed"); self.assertEqual(job["attempts"], 2)

    def test_retention_expiry(self):
        self.start(); self.e.expire(T + timedelta(days=22))
        self.assertFalse(self.e.events)
        self.assertEqual(self.e.windows[("site_demo", "epoch_A")]["state"], "expired")

    def test_session_cannot_change_epoch(self):
        self.e.sessions[("site_demo", "session_A")] = "epoch_B"
        with self.assertRaises(Rejected): self.start()

class SchemaTests(unittest.TestCase):
    def test_schema_creation_and_integrity(self):
        with sqlite3.connect(":memory:") as conn:
            conn.executescript(Path(__file__).with_name("schema.sql").read_text())
            self.assertEqual(conn.execute("PRAGMA integrity_check").fetchone()[0], "ok")
            self.assertEqual(conn.execute("PRAGMA foreign_key_check").fetchall(), [])
            self.assertEqual(conn.execute("PRAGMA foreign_keys").fetchone()[0], 1)

    def test_example_json_parses(self):
        data = json.loads(Path(__file__).with_name("examples.json").read_text())
        self.assertTrue(data["synthetic"])
        self.assertEqual(data["event"]["schema_version"], "1.0")

if __name__ == "__main__":
    unittest.main(verbosity=2)
