export function useIcons() {
  const cleanIconName = (iconName: string): string => {
    if (!iconName) return 'question-circle' 

    return iconName
      .replace(/^(fa|fas|far)\s/, '') // Remove leading 'fa', 'fas', or 'far' with space
      .replace('fa-', '')            // Remove 'fa-' prefix
      .replace(/\s/g, '-')           
      .toLowerCase()                 
  }

  return { cleanIconName }
}
