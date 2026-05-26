import { useMemo } from 'react'
import { motion } from 'framer-motion'
import HeroSection from '../components/HeroSection'
import RoadmapSection from '../components/RoadmapSection'
import FeatureSection from '../components/FeatureSection'
import UserProgress from '../components/UserProgress'
import roadmapsData from '../content/roadmaps.json'
import { useApp } from '../context/AppContext'

export default function HomePage() {
  const { state, metadata, customRoadmaps = [] } = useApp()
  const dbCourses = metadata?.courses || []
  const userProgress = state?.completedChapters || {}

  const dynamicRoadmaps = useMemo(() => {
    // Add default category / icon fallback to custom roadmaps
    const customWithMeta = customRoadmaps.map(cr => ({
      ...cr,
      category: cr.category || 'Custom',
      icon: cr.icon || 'Layout',
      duration: cr.duration || '3 Months'
    }))

    const allRoadmaps = [...roadmapsData, ...customWithMeta]

    return allRoadmaps.map(roadmap => {
      let previousCompleted = true // The first course in the path is unlocked

      const steps = (roadmap.steps || []).map(step => {
        const targetId = step.courseId || step.id
        const matchingCourse = dbCourses.find(c => c.id === targetId || c.slug === targetId)
        let progress = 0
        let courseUrl = ''

        if (matchingCourse) {
          const lessons = matchingCourse.chapters || []
          const total = lessons.length
          const done = lessons.filter(l => {
            const key = `${matchingCourse.id}:${l.slug}`
            return userProgress[key] === true
          }).length
          progress = total > 0 ? Math.round((done / total) * 100) : 0
          
          if (lessons.length > 0) {
            courseUrl = `/chapter/${matchingCourse.slug}/${lessons[0].slug}`
          }
        }

        // A step is locked if the previous step is not completed.
        // If the step has progress > 0, it should be unlocked.
        const isLocked = !previousCompleted && progress === 0

        // Set previousCompleted for the next step's lock calculation.
        previousCompleted = progress === 100

        return {
          ...step,
          progress,
          isLocked,
          courseUrl
        }
      })

      return {
        ...roadmap,
        steps
      }
    })
  }, [dbCourses, userProgress, customRoadmaps])

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-0"
    >
      <HeroSection />
      
      <UserProgress />
      
      {/* Background Section for Features and Roadmaps */}
      <div className="relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <FeatureSection />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      <RoadmapSection roadmaps={dynamicRoadmaps} />


    </motion.div>
  )
}
