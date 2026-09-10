export interface Project {
  id: string
  name: string
  isOwned: boolean
}

export interface ProjectLists {
  ownedProjects: Project[]
  sharedProjects: Project[]
}
