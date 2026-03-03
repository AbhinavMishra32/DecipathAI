"use client"

import Spline from "@splinetool/react-spline"
import type { Application } from "@splinetool/runtime"
import { useCallback } from "react"

type AuthSplineSceneProps = {
  scene: string
  className?: string
}

export default function AuthSplineScene({ scene, className }: AuthSplineSceneProps) {
  const handleLoad = useCallback((app: Application) => {
    // Restrict Spline to canvas-level events so overlay UI blocks pointer interactions.
    app.setGlobalEvents(false)
  }, [])

  return <Spline scene={scene} className={className} onLoad={handleLoad} />
}

