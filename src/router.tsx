import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { ProjectIIIPage } from "@/projects/project-iii/ProjectIIIPage";
import { ProjectVIPage } from "@/projects/project-vi/ProjectVIPage";
import { ProjectVIIPage } from "@/projects/project-vii/ProjectVIIPage";
import { ProjectVIIIPage } from "@/projects/project-viii/ProjectVIIIPage";
import { ProjectXPage } from "@/projects/project-x/ProjectXPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "projekt-iii", element: <ProjectIIIPage /> },
      { path: "projekt-vi", element: <ProjectVIPage /> },
      { path: "projekt-vii", element: <ProjectVIIPage /> },
      { path: "projekt-viii", element: <ProjectVIIIPage /> },
      { path: "projekt-x", element: <ProjectXPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
