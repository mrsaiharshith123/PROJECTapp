import "./ui/styles/update-test-minimal.css";

document.documentElement.dataset.ui = "ct";
document.documentElement.dataset.theme = "dark";
document.documentElement.classList.add("dark");

const { mountUpdateTestShell } = await import("./mountUpdateTestShell.jsx");
mountUpdateTestShell();
