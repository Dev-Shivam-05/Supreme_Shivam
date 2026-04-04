const getHome = (req, res) => {
  res.render("pages/index", {
    pageTitle: "Home | Shivam Bhadoriya",
    activePage: "home",
  });
};

const getAbout = (req, res) => {
  res.render("pages/about", {
    pageTitle: "About Me | Shivam Bhadoriya",
    activePage: "about",
  });
};

const getServices = (req, res) => {
  res.render("pages/services", {
    pageTitle: "Services | Shivam Bhadoriya",
    activePage: "services",
  });
};

const getContact = (req, res) => {
  res.render("pages/contact", {
    pageTitle: "Contact Me | Shivam Bhadoriya",
    activePage: "contact",
  });
};

module.exports = {
  getHome,
  getAbout,
  getServices,
  getContact,
};