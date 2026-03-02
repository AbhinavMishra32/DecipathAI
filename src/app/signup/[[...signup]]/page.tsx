"use client"

import { SignUp } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Sparkles, Stars } from "lucide-react"
import { useEffect, useState } from "react"
import { hubotSans } from "@/lib/fonts"

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
const hasValidClerkPublishableKey = Boolean(publishableKey && publishableKey.startsWith("pk_"))

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false)
  const [hoverButton, setHoverButton] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`${hubotSans.className} min-h-screen bg-black text-white flex flex-col overflow-hidden relative`}>
      {/* Logo only */}
      {/* <header className="w-full max-w-7xl mx-auto px-4 py-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="h-10 w-10 rounded-md bg-white flex items-center justify-center relative"
          >
            <div className="h-6 w-6 rounded-sm bg-black" />
            <motion.div
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="absolute -inset-1 bg-indigo-500/30 rounded-md blur-sm"
            />
          </motion.div>
        </Link>
      </header> */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-4 relative"
        >
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Link
              href="/"
              className="inline-flex items-center text-sm text-indigo-300 mb-6 hover:text-indigo-200 transition-all group"
            >
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="mr-2 h-4 w-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.span>
              <span className="relative">
                Back to home
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 relative"
          >
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute -top-10 -right-10 text-indigo-300/30"
            >
              <Stars className="h-20 w-20" />
            </motion.div> */}

            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-200 via-indigo-100 to-indigo-500 from-10% via-30% bg-clip-text text-transparent relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Join
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                    textShadow: "0 0 30px rgba(122, 104, 255, 0.2), 0 0 100px rgba(122, 104, 255, 0.1)"
                }}
              >
                Decipath
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-gray-400 mt-2 text-lg"
            >
              Start your journey to greatness
            </motion.p>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="h-[1px] bg-gradient-to-r from-indigo-500 to-transparent mt-4"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative z-10"
            onMouseEnter={() => setHoverButton(true)}
            onMouseLeave={() => setHoverButton(false)}
          >
            <AnimatePresence>
              {hoverButton && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-xl blur-xl -z-10"
                />
              )}
            </AnimatePresence>

            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl blur-xl -z-10"
            /> */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="absolute bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl -z-10"
            />

            {/* <div className="bg-gray-900/80 backdrop-blur-md p-8 rounded-xl border border-gray-800/80 shadow-[0_0_15px_rgba(139,92,246,0.15)]"> */}
              {hasValidClerkPublishableKey ? (
                <SignUp
                  forceRedirectUrl="/roadmaps"
                  fallbackRedirectUrl="/roadmaps"
                  appearance={{
                    elements: {
                      formButtonPrimary:
                        "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_10px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_15px_rgba(139,92,246,0.4)]",
                      formFieldInput:
                        "bg-gray-800/80 border-gray-700 text-white rounded-md px-3 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200",
                      card: "bg-transparent shadow-none",
                      headerTitle: "text-white text-2xl font-bold",
                      headerSubtitle: "text-gray-400",
                      socialButtonsBlockButton:
                        "border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-white transition-all duration-200 hover:border-indigo-500/50",
                      footerActionLink: "text-indigo-400 hover:text-indigo-300",
                      identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
                      formFieldLabel: "text-gray-300 font-medium",
                      formFieldAction: "text-indigo-400 hover:text-indigo-300",
                      formFieldSuccessText: "text-green-400",
                      formFieldErrorText: "text-red-400",
                      dividerLine: "bg-gray-700",
                      dividerText: "text-gray-400",
                    },
                  }}
                />
              ) : (
                <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Clerk auth is not configured. Set <span className="font-semibold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> to enable sign up.
                </div>
              )}
            {/* </div> */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-400 flex items-center justify-center gap-2">
              <motion.span
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              >
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </motion.span>
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors relative group"
              >
                Sign in
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />

        {/* Main glow elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 1,
          }}
          className="absolute bottom-1/3 -left-20 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[120px]"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 2,
          }}
          className="absolute top-2/3 right-1/3 w-[20rem] h-[20rem] bg-indigo-700/10 rounded-full blur-[80px]"
        />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.02] -z-10"></div>
    </div>
  )
}
