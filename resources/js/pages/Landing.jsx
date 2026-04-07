import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronDownIcon,
    CheckCircleIcon,
    BoltIcon,
    ChartBarIcon,
    UserGroupIcon,
    BriefcaseIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

/**
 * Landing Page Component
 *
 * Modern one-page website for Great Leap App
 * High-converting design with clear value proposition
 */
const Landing = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-slate-950 text-white min-h-screen">
            {/* Navigation */}
            <nav className="fixed w-full top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-teal-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-teal-600 rounded-lg flex items-center justify-center font-bold text-slate-900">
                            GL
                        </div>
                        <div>
                            <div className="text-lg font-bold tracking-tight">GREAT LEAP</div>
                            <div className="text-xs text-teal-400">™</div>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-10">
                        <button onClick={() => scrollToSection('features')} className="text-slate-300 hover:text-lime-400 transition font-medium text-sm">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="text-slate-300 hover:text-lime-400 transition font-medium text-sm">How It Works</button>
                        <button onClick={() => scrollToSection('benefits')} className="text-slate-300 hover:text-lime-400 transition font-medium text-sm">Benefits</button>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/login" className="px-6 py-2 rounded-lg border border-teal-700/50 text-teal-400 hover:border-teal-600 hover:text-lime-400 transition font-semibold text-sm">
                            Login
                        </Link>
                        <Link to="/signup" className="px-6 py-2 rounded-lg bg-gradient-to-r from-lime-400 to-teal-500 hover:from-lime-300 hover:to-teal-400 text-slate-900 transition font-semibold text-sm">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center pt-32 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 right-0 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" style={{
                        transform: `translateY(${scrollY * 0.3}px)`
                    }} />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <div className="mb-8 inline-block">
                        <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest bg-teal-950/50 px-4 py-2 rounded-full border border-teal-900/50">
                            Enterprise Role Management
                        </span>
                    </div>

                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
                        Run Your Business
                        <br />
                        <span className="bg-gradient-to-r from-lime-400 via-teal-400 to-teal-300 bg-clip-text text-transparent">
                            Roles. Not Just Tasks.
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                        A sophisticated system that defines roles, clarifies responsibilities, and ensures consistent execution across your entire team. Every day.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link
                            to="/signup"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg bg-gradient-to-r from-lime-400 to-teal-500 hover:from-lime-300 hover:to-teal-400 text-slate-900 transition font-semibold text-lg shadow-lg shadow-lime-500/20"
                        >
                            Create Your Company <ArrowRightIcon className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={() => scrollToSection('how-it-works')}
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg border border-teal-700/50 text-slate-200 hover:border-teal-600 hover:bg-teal-950/30 transition font-semibold text-lg"
                        >
                            See How It Works <ChevronDownIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Feature Pills */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-lime-400 flex-shrink-0" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-lime-500" />
                            <span>7-day free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-lime-500" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className="py-20 bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        The Reality of Business Execution
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <UserGroupIcon className="w-8 h-8 text-red-500" />,
                                title: 'Dependency on Individuals',
                                desc: 'Key people leave and suddenly nothing works. Knowledge is trapped in their heads.'
                            },
                            {
                                icon: <BriefcaseIcon className="w-8 h-8 text-red-500" />,
                                title: 'Lack of Clarity',
                                desc: 'Teams are unclear about roles, responsibilities, and how their work fits the bigger picture.'
                            },
                            {
                                icon: <ChartBarIcon className="w-8 h-8 text-red-500" />,
                                title: 'Inconsistent Execution',
                                desc: 'Same work gets done differently each time. Quality varies. Mistakes repeat.'
                            },
                        ].map((problem, idx) => (
                            <div key={idx} className="p-8 bg-slate-800/50 border border-slate-700/50 rounded-xl border border-slate-700/50 hover:border-teal-700/30 transition">
                                <div className="mb-4">{problem.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
                                <p className="text-slate-400">{problem.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section id="solution" className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">
                                Meet
                                <br />
                                <span className="bg-gradient-to-r from-teal-700 to-teal-600 bg-clip-text text-transparent">
                                    Role-Based Execution
                                </span>
                            </h2>
                            <p className="text-slate-200 mb-6 text-lg">
                                Instead of managing individual tasks, define clear roles. The system generates the work each person needs to do, with step-by-step guidance.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Every role has clear responsibilities',
                                    'Work is automatically assigned based on roles',
                                    'Teams execute with built-in guidance',
                                    'Quality and consistency improve automatically'
                                ].map((point, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <CheckCircleIcon className="w-5 h-5 text-lime-500 flex-shrink-0 mt-1" />
                                        <span className="text-slate-200">{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-700/10 to-teal-600/10 rounded-xl blur-xl" />
                            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-xl border border-slate-700/50 p-8">
                                <div className="space-y-4">
                                    <div className="h-12 bg-gray-200 rounded-lg" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-24 bg-gray-200 rounded-lg" />
                                        <div className="h-24 bg-gray-200 rounded-lg" />
                                    </div>
                                    <div className="h-16 bg-gray-200 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        Powerful Features Built In
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: <BoltIcon className="w-7 h-7 text-blue-400" />,
                                title: 'Role-Driven Task Generation',
                                desc: 'Define roles once. The system generates tasks and work assignments automatically.'
                            },
                            {
                                icon: <CheckCircleIcon className="w-7 h-7 text-teal-700" />,
                                title: 'Guided Execution',
                                desc: 'Step-by-step instructions and checklists ensure work is done right every time.'
                            },
                            {
                                icon: <UserGroupIcon className="w-7 h-7 text-blue-400" />,
                                title: 'Team Communication',
                                desc: 'Built-in messaging, notes, and collaboration within the context of work.'
                            },
                            {
                                icon: <ChartBarIcon className="w-7 h-7 text-teal-700" />,
                                title: 'Performance Tracking',
                                desc: 'Real-time visibility into who did what, when, and how well they did it.'
                            },
                            {
                                icon: <BriefcaseIcon className="w-7 h-7 text-blue-400" />,
                                title: 'Process Documentation',
                                desc: 'Your processes are automatically documented as your team executes work.'
                            },
                            {
                                icon: <BoltIcon className="w-7 h-7 text-teal-700" />,
                                title: 'Continuous Improvement',
                                desc: 'Identify bottlenecks and improve processes based on real execution data.'
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 bg-slate-800/50 border border-slate-700/50 rounded-xl border border-slate-700/50 hover:border-teal-700/30 transition">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        How It Works
                    </h2>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                step: '1',
                                title: 'Define Roles',
                                desc: 'Create clear roles with responsibilities and authorities'
                            },
                            {
                                step: '2',
                                title: 'Set Activities',
                                desc: 'Define the activities and processes each role performs'
                            },
                            {
                                step: '3',
                                title: 'Team Executes',
                                desc: 'Your team executes with guidance and built-in checklists'
                            },
                            {
                                step: '4',
                                title: 'System Improves',
                                desc: 'Learn from execution data and continuously improve'
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-700 to-teal-600 flex items-center justify-center text-xl font-bold mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-center mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-center text-sm">{item.desc}</p>
                                </div>
                                {idx < 3 && (
                                    <div className="hidden md:block absolute top-8 -right-4 w-8 h-1 bg-gradient-to-r from-teal-700 to-teal-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        Results That Matter
                    </h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            {[
                                {
                                    title: 'Reduce Dependency',
                                    desc: 'Work is done by systems and processes, not heroes. Your business survives leadership changes.'
                                },
                                {
                                    title: 'Consistency',
                                    desc: 'Same work gets done the same way, every time. Quality becomes predictable.'
                                },
                                {
                                    title: 'Faster Onboarding',
                                    desc: 'New employees learn roles and processes immediately. They contribute faster.'
                                },
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-700 to-teal-600 flex items-center justify-center flex-shrink-0">
                                        <CheckCircleIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                                        <p className="text-slate-400">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-700/10 to-teal-600/10 rounded-xl blur-xl" />
                            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-xl border border-slate-700/50 p-8">
                                <p className="text-lg text-slate-200 italic mb-6">
                                    "Great Leap helped us eliminate our dependency on key people. Now work happens consistently, even when someone takes time off."
                                </p>
                                <div>
                                    <p className="font-bold">Sarah Chen</p>
                                    <p className="text-slate-400 text-sm">COO, Tech Startup</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="cta" className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-5xl font-bold mb-8">
                        Start Building a System
                        <br />
                        <span className="bg-gradient-to-r from-teal-700 to-teal-600 bg-clip-text text-transparent">
                            That Runs Your Work
                        </span>
                    </h2>

                    <p className="text-xl text-slate-200 mb-12">
                        7-day free trial. No credit card required. Cancel anytime.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-lime-400 to-teal-500 hover:from-lime-300 hover:to-teal-400 text-slate-900 transition font-semibold text-lg shadow-lg shadow-lime-500/20"
                        >
                            Create Your Company <ArrowRightIcon className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-teal-700/50 text-slate-200 hover:border-teal-600 hover:bg-teal-950/30 transition font-semibold text-lg"
                        >
                            Login to Your Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-700/50 py-12 bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
                    <p>&copy; 2024 GREAT LEAP™. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
