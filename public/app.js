document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector("#menu-toggle");
const navigation = document.querySelector("#site-nav");

function closeMenu() {
  header.dataset.menuOpen = "false";
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.hidden = false;
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(expanded));
  header.dataset.menuOpen = String(expanded);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && header.dataset.menuOpen === "true") {
    closeMenu();
    menuToggle.focus();
  }
});

const navLinks = [...navigation.querySelectorAll("a")];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          for (const link of navLinks) {
            if (link.hash === `#${entry.target.id}`) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          }
        }
      }
    },
    { rootMargin: "-10% 0px -65% 0px", threshold: 0 },
  );
  for (const link of navLinks) {
    observer.observe(document.querySelector(link.hash));
  }
}

const printButton = document.querySelector("#print-resume");
printButton.hidden = false;
printButton.addEventListener("click", () => window.print());

let previouslyOpenRoles;
window.addEventListener("beforeprint", () => {
  if (previouslyOpenRoles) return;
  const roles = [...document.querySelectorAll(".career-card")];
  previouslyOpenRoles = roles.filter((role) => role.open);
  for (const role of roles) role.open = true;
});
window.addEventListener("afterprint", () => {
  if (!previouslyOpenRoles) return;
  for (const role of document.querySelectorAll(".career-card")) {
    role.open = previouslyOpenRoles.includes(role);
  }
  previouslyOpenRoles = undefined;
});
