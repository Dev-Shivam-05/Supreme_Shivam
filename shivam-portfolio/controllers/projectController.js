const Project = require("../models/Project");

const getProjects = async (req, res) => {
  const projects = [
    {
      title: "AI Art Generator",
      description: "A production-grade MERN app that turns prompts into stunning artwork.",
      category: "Personal SaaS",
      techStack: ["Node.js", "React", "OpenAI API", "MongoDB"],
      imageUrl: "/images/projects/ai-art-generator.jpg",
      liveLink: "https://artgen.shivambhadoriya.dev",
      repoLink: "https://github.com/shivam/ai-art-generator"
    },
    {
      title: "Weather App",
      description: "A fast, minimalist weather experience with geolocation.",
      category: "Frontend",
      techStack: ["JavaScript", "OpenWeather API", "Bootstrap"],
      imageUrl: "/images/projects/weather-app.jpg",
      liveLink: "https://weather.shivambhadoriya.dev",
      repoLink: "https://github.com/shivam/weather-app"
    },
    {
      title: "Recipe Book",
      description: "A recipe manager with smart search and meal planning.",
      category: "Full Stack",
      techStack: ["Node.js", "Express", "MongoDB", "EJS"],
      imageUrl: "/images/projects/recipe-book.jpg",
      liveLink: "https://recipes.shivambhadoriya.dev",
      repoLink: "https://github.com/shivam/recipe-book"
    }
  ];

  // HERE IS THE FIX: Passing pageTitle and activePage
  res.render("projects/index", { 
    projects,
    pageTitle: "Projects | Shivam Bhadoriya",
    activePage: "projects"
  });
};

const getProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).send("Not Found");
  }
  return res.render("projects/show", { project });
};

const createProject = async (req, res) => {
  const payload = {
    ...req.body,
    image: req.file ? `/uploads/projects/${req.file.filename}` : undefined
  };
  await Project.create(payload);
  res.redirect("/admin/projects");
};

const updateProject = async (req, res) => {
  const payload = {
    ...req.body
  };
  if (req.file) {
    payload.image = `/uploads/projects/${req.file.filename}`;
  }
  await Project.findByIdAndUpdate(req.params.id, payload);
  res.redirect("/admin/projects");
};

const deleteProject = async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.redirect("/admin/projects");
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
};
