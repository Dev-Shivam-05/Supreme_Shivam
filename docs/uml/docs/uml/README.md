# 📊 UML Diagrams - Blog Platform

This folder contains all UML diagrams for the Blog Platform project using PlantUML.

## 📁 Diagram Files

| File | Description | Type |
|------|-------------|------|
| `01-use-case-diagram.puml` | System actors and their interactions | Use Case |
| `02-user-journey-activity.puml` | Complete user flow from visitor to aut  hor | Activity |
| `03-blog-creation-sequence.puml` | Blog creation process interactions | Sequence |
| `04-blog-state-diagram.puml` | Blog lifecycle states | State |
| `05-class-diagram.puml` | System classes and relationships | Class |
| `06-authentication-sequence.puml` | Login and registration flow | Sequence |
| `07-component-diagram.puml` | System component architecture | Component |
| `08-deployment-diagram.puml` | Production deployment setup | Deployment |
| `09-admin-moderation-activity.puml` | Admin blog review process | Activity |
| `10-database-er-diagram.puml` | Database schema and relationships | ER Diagram |

## 🎯 How to View Diagrams

### Method 1: VS Code (Recommended)

1. **Install PlantUML Extension:**
   - Open VS Code
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
   - Search for "PlantUML" by jebbs
   - Click Install

2. **Install Graphviz:**
   ```bash
   # Windows (using Chocolatey)****
   choco install graphviz
   
   # Mac
   brew install graphviz
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install **graphviz**


Login page
Registration Page
Verification Page
UserDash Board [total blogs , total view , draft count]
~ BLOG Editor [title,featured image,category,tags,content(rich editor),SEO(settings) , at the end publish and draft button both]
blog home page [where user can see default blogs currently]
