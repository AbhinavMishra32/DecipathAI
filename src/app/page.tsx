'use client';

import React from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookmarkCheck,
  BrainCircuit,
  Compass,
  GitBranch,
  LockKeyhole,
  MoonStar,
  PenSquare,
  Sparkles,
  Target,
  TimerReset,
  Waypoints,
  Workflow,
} from 'lucide-react';

import LandingNavbar from '../components/LandingNavbar';
import LandingImage from '../assets/landing.png';
import { FlipWords } from '../components/ui/flip-words';
import { hubotSans } from '@/lib/fonts';
import { VelocityScroll } from '@/components/magicui/scroll-based-velocity';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import LandingIntroOverlay from '@/components/LandingIntroOverlay';

type FeatureCard = {
  title: string
  description: string
  icon: LucideIcon
}

type PreviewNode = {
  id: string
  label: string
  icon: LucideIcon
  x: number
  y: number
  tone: 'violet' | 'blue' | 'cyan'
}

type FlowStep = {
  title: string
  description: string
  icon: LucideIcon
}

const featureCards: FeatureCard[] = [
  {
    title: 'AI-Powered Roadmap Generation',
    description: 'Describe where you are and where you want to go. Decipath creates a deep roadmap in seconds.',
    icon: Sparkles,
  },
  {
    title: 'Interactive Graph View',
    description: 'Every milestone becomes a clickable node with connected context, so you see the full decision tree.',
    icon: Waypoints,
  },
  {
    title: 'Actionable Tasks Per Step',
    description: 'Each node includes focused tasks, next steps, and realistic time estimates you can execute immediately.',
    icon: PenSquare,
  },
  {
    title: 'Branching + Converging Paths',
    description: 'Explore alternate routes, prerequisites, and merged tracks without losing the bigger picture.',
    icon: GitBranch,
  },
  {
    title: 'Theme-Aware Experience',
    description: 'A cohesive visual system across light and dark surfaces with consistent readability and contrast.',
    icon: MoonStar,
  },
  {
    title: 'Saved Progress + Secure Access',
    description: 'Sign in, save roadmaps, return later, and continue from the exact point you left off.',
    icon: BookmarkCheck,
  },
]

const flowSteps: FlowStep[] = [
  {
    title: 'Define your starting point',
    description: 'Tell Decipath your current state and constraints.',
    icon: Compass,
  },
  {
    title: 'Set the target',
    description: 'Describe what success looks like in concrete terms.',
    icon: Target,
  },
  {
    title: 'Generate the map',
    description: 'Get a multi-branch roadmap with timelines and dependencies.',
    icon: Workflow,
  },
  {
    title: 'Execute node by node',
    description: 'Open a node, complete tasks, and move forward with clarity.',
    icon: Waypoints,
  },
]



const Page = () => {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    // const [windowWidth, setWindowWidth] = useState(window.innerWidth); // put this in useeffect to run in client cuz without it, it cant know the window size in server, even if we write 'use client';
    // const [scrollY, setScrollY] = useState<number>(0);

    // useEffect(() => {
    //     const handleScroll = () => {
    //       setScrollY(window.scrollY)
    //     }
    
    //     window.addEventListener('scroll', handleScroll)
    //     return () => window.removeEventListener('scroll', handleScroll)
    //   });
    
    //   const [scope, animate] = useAnimate()

    // useEffect(() => {
    //     const handleResize = () => {
    //         setWindowWidth(window.innerWidth);
    //     }
    //     window.addEventListener('resize', handleResize);

    //     return () => {
    //         window.removeEventListener('resize', handleResize);
    //     }
    // });

    // useEffect(() => {
    //     animate([
    //       [".stagger-fade-in", { opacity: [0, 1], y: [20, 0] }, { duration: 0.5, delay: stagger(0.1) }],
    //       [".hero-title", { clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"] }, { duration: 0.5, at: "<" }],
    //       [".hero-subtitle", { clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"] }, { duration: 0.5, at: "-0.25" }],
    //     ])
    //   }, [animate])

    // useEffect(() => {
    //     if (isSignedIn) {
    //         router.push('/app/home');
    //     }
    // }, [isSignedIn, router]);
    return (
        <div className='flex flex-col bg-neutral-950 w-screen h-screen overflow-x-hidden'>
            <div className='h-[74px] w-full items-center justify-center flex'>
                <LandingNavbar />
            </div>
            <div className='w-full h-full block bg-neutral-950'>
                <section className='flex flex-col bg-neutral-950 justify-center mt-14 md:mt-0'>
                    <div className="text-center md:mt-48 mt-16 font-['dm_serif_display']">
                        <div className='inline-block'>
                            <h1 className={`${hubotSans.className} animate-gradient-x bg-gradient-to-r from-indigo-300 via-indigo-200 to-indigo-300 bg-clip-text text-transparent mx-4 md:text-7xl text-4xl text-center drop-shadow-[0_0_30px_rgba(245,196,245,0.4)] dark:drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]`}>
                                Never Be Unsure
                            </h1>
                        </div>
                        <br />
                        <div className='bg-gradient-to-b inline-block from-white to-indigo-300 bg-clip-text'>
                            <h1
                                className={` ${hubotSans.className} text-transparent mx-4 md:mb-10 md:text-7xl text-3xl text-center font-extrabold `}>
                                about <FlipWords words={['making progress', 'your future', 'getting there']} duration={7000} className='' />
                            </h1>
                        </div>
                        <h3 className={`${hubotSans.className} text-center md:pt-2 pt-1 md:text-xl text-sm text-indigo-100`}>
                            Use Decipath to create a roadmap of anything you can think of
                        </h3>
                        <Link href="/signup">
                            <div className={`${hubotSans.className} mt-8 bg-white hover:bg-indigo-600 inline-block px-5 py-2 rounded-full hover:px-8 hover:text-white transition-all duration-300 ease-out`}>Get Started</div>
                        </Link>
                    </div>
                    {/* {windowWidth > 768 ? ( */}
                        <div className='h-fit w-[80vw] mx-auto mt-14 overflow-hidden rounded-3xl shadow-[0px_-100px_300px_-40px_rgba(93,43,163,0.23)] relative'>
                            <Image src={LandingImage} alt='landing-page' className='w-full h-auto object-scale-down border-[2px] border-neutral-800 rounded-3xl' />
                            <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-neutral-950 rounded-3xl'></div>
                        </div>
                    {/* // ) : ( */}
                        // <div className='h-fit w-[400px] max-w-[90vw] mx-auto mt-10 overflow-hidden rounded-2xl shadow-[0px_-50px_100px_-10px_rgba(93,93,93,0.23)] relative'>
                            {/* <img src={LandingImageMobile} alt='landing-page' className='w-full h-full object-scale-down border-[1px] border-neutral-700 rounded-2xl' /> */}
                            // <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-neutral-950 rounded-2xl'></div>
                        // </div>
                    {/* )} */}
                </section>
                <section>
                    <div className="relative mt-10 flex w-full flex-col items-center justify-center overflow-hidden bg-transparent text-indigo-900">
                        <VelocityScroll>Works with any idea </VelocityScroll>
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/4 bg-gradient-to-r from-neutral-950/70 from-30%"></div>
                         <div className="pointer-events-none absolute inset-y-0 right-0 w-2/4 bg-gradient-to-l from-neutral-950/70 from-30%"></div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Page;