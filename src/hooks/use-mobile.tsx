
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    handleResize()
    
    // Add event listener for window resize
    window.addEventListener("resize", handleResize)
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return !!isMobile
}
