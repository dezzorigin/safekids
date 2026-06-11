export const getStudentGroup = () => 
  sessionStorage.getItem('studentGroup')

export const setStudentGroup = (group: number) =>
  sessionStorage.setItem('studentGroup', group.toString())

export const clearStudentGroup = () =>
  sessionStorage.removeItem('studentGroup')
