'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [time, setTime] = useState(0);

  // Handle scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Animation timer for continuous animations
  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      setTime(elapsed / 1000); // Convert to seconds
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Animation on load
  useEffect(() => {
    // Staggered animation entrance
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md">
        <nav className="container mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-70"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 relative z-10"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">UniFinance</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-blue-300 hover:text-blue-100 transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" passHref>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-900/20">
                Sign Up
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        className="relative min-h-screen pt-20 overflow-hidden"
      >
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950 to-black"></div>

        {/* Static grid */}
        <div
          className="absolute inset-0 opacity-20"
        >
          <div className="absolute inset-0 backdrop-blur-3xl"></div>
        </div>

        {/* Static decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          ></div>

          {/* Static decorative elements */}
          <div className="absolute w-40 h-40 rounded-full bg-blue-500/20 blur-3xl top-1/4 left-1/4 opacity-30"></div>
          <div className="absolute w-32 h-32 rounded-full bg-blue-600/20 blur-3xl bottom-1/3 right-1/4 opacity-20"></div>
          <div className="absolute w-48 h-48 rounded-full bg-blue-700/20 blur-3xl bottom-1/4 left-1/3 opacity-20"></div>
          <div className="absolute w-24 h-24 rounded-full bg-purple-500/20 blur-3xl top-2/3 right-1/3 opacity-15"></div>
          <div className="absolute w-20 h-20 rounded-full bg-green-500/20 blur-3xl top-1/2 right-1/5 opacity-15"></div>
        </div>

        {/* Content container */}
        <div className="container mx-auto px-6 pt-20 pb-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text content */}
            <div className="flex-1 space-y-8 max-w-2xl">
              <div
                className={`inline-block px-4 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-md transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                }}
              >
                Reimagine Your Financial Future
              </div>

              <h1
                className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}
              >
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-blue-100 to-blue-400">
                  Master Your Money
                </span>
                <span className="block mt-2 text-white">
                  <span className="relative">
                    Shape Your Future
                    <span className="absolute bottom-2 left-0 w-full h-1 bg-blue-500 rounded-full opacity-70"></span>
                  </span>
                </span>
              </h1>

              <p
                className={`text-xl text-blue-100/80 max-w-[600px] leading-relaxed transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ transform: isLoaded ? 'translateY(0)' : 'translateY(40px)' }}
              >
                UniFinance transforms how you interact with your money. Visualize your wealth, track expenses, and build your financial empire with our revolutionary platform.
              </p>

              <div
                className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ transform: isLoaded ? 'translateY(0)' : 'translateY(50px)' }}
              >
                <Link href="/auth/signup" passHref>
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-900/20 relative overflow-hidden group">
                    <span className="relative z-10">Get Started Free</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
                <Link href="#features" passHref>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-blue-500/50 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100 transition-all">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Interactive 3D card */}
            <div
              className={`flex-1 relative transition-all duration-1000 delay-800 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: isLoaded ? 'translateY(0)' : 'translateY(60px)' }}
            >
              <div
                className="relative w-full max-w-[800px] mx-auto"
              >
                {/* MacBook Mockup */}
                <div className="relative w-full"
                >
                  {/* MacBook Image */}
                  <div className="relative">
                    <img
                      src="/oi2.png"
                      alt="MacBook with UniFinance Dashboard"
                      className="w-full h-auto relative z-10"
                    />




                  </div>
                </div>



                {/* Code snippets floating around */}
                <div className="absolute -right-[10%] top-[20%] w-[180px] opacity-70 transform rotate-3">
                  <div className="bg-blue-950/40 backdrop-blur-sm rounded-lg p-3 border border-blue-500/20 font-mono text-xs text-blue-300 overflow-hidden">
                    <div className="mb-1 text-blue-400">// Financial API</div>
                    <div>const data = await</div>
                    <div>  api.getBalance();</div>
                    <div>return {`{`}</div>
                    <div>  status: "success",</div>
                    <div>  balance: data.amount</div>
                    <div>{`}`};</div>
                  </div>
                </div>

                <div className="absolute -left-[10%] top-[60%] w-[160px] opacity-70 transform -rotate-2">
                  <div className="bg-blue-950/40 backdrop-blur-sm rounded-lg p-3 border border-blue-500/20 font-mono text-xs text-green-300 overflow-hidden">
                    <div className="mb-1 text-green-400">// Transaction</div>
                    <div>transaction.create({`{`}</div>
                    <div>  amount: 2850.00,</div>
                    <div>  type: "income",</div>
                    <div>  source: "Acme Inc."</div>
                    <div>{`}`});</div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -top-5 -left-5 w-20 h-20 bg-blue-300 rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>

          {/* Trusted Companies Infinite Scroll */}
          <div className="mt-20 relative w-[100vw] -ml-[calc(50vw-50%)]">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-md">
                TRUSTED BY LEADING COMPANIES
              </div>
            </div>

            <div className="relative w-full py-8 bg-blue-950/30 border-y border-blue-500/20">
              {/* Gradient overlays for infinite scroll effect */}
              <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>

              {/* Marquee - moves left */}
              <Marquee
                speed={25}
                gradient={false}
                pauseOnHover={true}
                className="py-4"
              >
                {[
                  { name: "Apple", logo: "/apple.webp", type: "img" },
                  { name: "Google", logo: "/Google.webp", type: "img" },
                  { name: "Microsoft", logo: "/microsoft.webp", type: "img" },
                  { name: "Vasco", logo: "/vasco.webp", type: "img" },
                  { name: "Fluminense", logo: "/fluminense.webp", type: "img" }
                ].map((company, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center mx-16 h-28 min-w-[240px] bg-blue-900/20 backdrop-blur-md border border-blue-500/20 rounded-lg px-8 transition-all hover:bg-blue-800/30 hover:border-blue-400/30 hover:scale-105"
                  >
                    <Image
                      src={company.logo}
                      alt={company.name}
                      width={70}
                      height={70}
                      className="mr-4 object-contain"
                      priority={company.name === "Apple"}
                    />
                    <span className="text-white font-medium text-lg">{company.name}</span>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex justify-center">
            <a
              href="#features"
              className="flex flex-col items-center text-blue-300 hover:text-blue-100 transition-colors"
            >
              <span className="text-sm mb-2">Explore Features</span>
              <div className="w-6 h-10 border-2 border-blue-500/50 rounded-full flex justify-center p-1">
                <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-black to-blue-950 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-md mb-4">
              Revolutionary Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-blue-300 mb-6">
              Reimagine Your Financial Future
            </h2>
            <p className="text-blue-200/80 max-w-2xl mx-auto text-lg">
              UniFinance combines cutting-edge technology with intuitive design to transform how you manage your money
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M18 6 7 17l-5-5" />
                    <path d="m22 10-7.5 7.5L13 16" />
                  </svg>
                ),
                title: "AI-Powered Expense Tracking",
                description: "Our intelligent system automatically categorizes your transactions and learns from your spending patterns to provide personalized insights."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                ),
                title: "Dynamic Budget Planning",
                description: "Create flexible budgets that adapt to your lifestyle. Set goals, track progress, and receive smart recommendations to optimize your spending."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                ),
                title: "Immersive Analytics",
                description: "Experience your financial data through interactive visualizations that reveal patterns and opportunities you never knew existed."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
                    <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                    <path d="M12 12v3" />
                  </svg>
                ),
                title: "Seamless Bank Integration",
                description: "Connect securely with your financial institutions for real-time data synchronization, including Nubank and other major banks."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ),
                title: "Predictive Financial Planning",
                description: "Our AI forecasts your financial future based on your habits and goals, helping you make informed decisions today."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                ),
                title: "Virtual Financial Cards",
                description: "Create and manage virtual cards for different spending categories, with real-time controls and insights for each transaction."
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-blue-900/20 backdrop-blur-md border border-blue-500/20 rounded-xl p-8 overflow-hidden hover:bg-blue-800/30 transition-all duration-500"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Glowing orb */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 text-blue-300 group-hover:text-blue-100 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-blue-200/80 leading-relaxed group-hover:text-blue-100/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Feature showcase */}
          <div className="mt-32 relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-blue-900/10 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                }}
              ></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 p-8 md:p-12">
              <div className="flex-1 space-y-8">
                <div className="inline-block px-4 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-md">
                  Featured Highlight
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  Financial Insights Like Never Before
                </h3>
                <p className="text-blue-200/80 text-lg leading-relaxed max-w-xl">
                  Our advanced analytics engine transforms complex financial data into clear, actionable insights. Discover spending patterns, identify saving opportunities, and visualize your financial journey in stunning detail.
                </p>
                <div className="flex flex-wrap gap-4">
                  {["AI-Powered", "Real-time Updates", "Predictive Analysis", "Custom Reports"].map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-800/50 text-blue-200 text-sm rounded-full border border-blue-500/30">
                      {tag}
                    </span>
                  ))}
                </div>
                <div>
                  <Link href="/auth/signup" passHref>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-900/20">
                      Experience It Now
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="relative w-full max-w-[500px] mx-auto">
                  {/* Decorative elements */}
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-300 rounded-full opacity-20 blur-xl"></div>

                  {/* Analytics visualization mockup */}
                  <div className="relative bg-blue-950 rounded-2xl shadow-2xl overflow-hidden border border-blue-500/30">
                    <div className="bg-blue-900/50 p-4 border-b border-blue-500/30 flex items-center justify-between">
                      <div className="text-sm font-medium text-white">Financial Analytics</div>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="text-lg font-bold text-white">Spending Overview</div>
                        <div className="text-sm text-blue-300">Last 30 Days</div>
                      </div>

                      {/* Chart visualization */}
                      <div className="h-64 w-full mb-6 relative">
                        <div className="absolute inset-0 flex items-end">
                          {[35, 28, 45, 30, 55, 48, 60, 52, 65, 58, 70, 75, 68, 80, 72, 85, 78, 90, 82, 95, 88, 100, 92, 85, 78, 88, 82, 90, 84, 92].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end">
                              <div
                                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm"
                                style={{ height: `${height}%` }}
                              ></div>
                            </div>
                          ))}
                        </div>

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-blue-950/80 pointer-events-none"></div>

                        {/* Trend line */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                          <path
                            d="M0,192 C20,160 40,128 60,144 C80,160 100,176 120,160 C140,144 160,128 180,112 C200,96 220,80 240,64 C260,48 280,32 300,16 L300,192 L0,192 Z"
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.5)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>

                      {/* Categories */}
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: "Groceries", amount: "$458.32", percent: 24 },
                          { name: "Entertainment", amount: "$285.75", percent: 15 },
                          { name: "Transportation", amount: "$342.18", percent: 18 },
                          { name: "Dining Out", amount: "$526.90", percent: 28 }
                        ].map((category, i) => (
                          <div key={i} className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/20">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-sm font-medium text-white">{category.name}</div>
                              <div className="text-sm text-blue-300">{category.amount}</div>
                            </div>
                            <div className="h-2 w-full bg-blue-900/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${category.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-b from-blue-950 to-black">
        {/* Background elements */}
        <div className="absolute inset-0">
          {/* Animated particles */}
          <div className="absolute inset-0">
            {isLoaded && (
              <>
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-blue-500 opacity-20 animate-pulse"
                    style={{
                      width: `${Math.random() * 10 + 5}px`,
                      height: `${Math.random() * 10 + 5}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${Math.random() * 5 + 3}s`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  ></div>
                ))}
              </>
            )}
          </div>

          {/* Glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500 rounded-full opacity-5 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-md mb-6">
              Transform Your Financial Future
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200">revolutionize</span> how you manage money?
            </h2>

            <p className="text-blue-200/80 mb-12 text-xl max-w-3xl mx-auto leading-relaxed">
              Join thousands of users who have transformed their financial lives with UniFinance's cutting-edge platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/signup" passHref>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-900/20 text-lg px-8 py-6 relative overflow-hidden group">
                  <span className="relative z-10">Start Your Free Trial</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </Link>

              <Button variant="outline" size="lg" className="border-blue-500/50 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100 transition-all text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-16">
              <p className="text-blue-300/70 mb-6 text-sm">TRUSTED BY FORWARD-THINKING INDIVIDUALS</p>
              <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-white/10 rounded-md backdrop-blur-sm"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20 border-t border-blue-900/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-70"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 relative z-10"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">UniFinance</span>
              </div>
              <p className="text-blue-200/70 max-w-xs">
                Revolutionizing personal finance with cutting-edge technology and intuitive design.
              </p>
              <div className="flex space-x-4">
                {['facebook', 'twitter', 'instagram', 'github'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-300 hover:bg-blue-800/50 hover:text-blue-100 transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {social === 'facebook' && <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />}
                      {social === 'twitter' && <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />}
                      {social === 'instagram' && <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />}
                      {social === 'github' && <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Product</h3>
              <ul className="space-y-4">
                <li><a href="#features" className="text-blue-200/70 hover:text-blue-100 transition-colors">Features</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Testimonials</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">About</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Blog</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Careers</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Legal</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-blue-200/70 hover:text-blue-100 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-blue-900/30 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-blue-200/50 mb-4 md:mb-0">
              © {new Date().getFullYear()} UniFinance. All rights reserved.
            </div>
            <div className="text-sm text-blue-200/50">
              Designed with <span className="text-red-400">♥</span> for the future of finance
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
