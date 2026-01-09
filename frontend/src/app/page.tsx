import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, Sparkles, Play } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0d17] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0d17]/80 backdrop-blur-lg border-b border-[#252033]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold font-['Outfit']">CinePal</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-[#a09dab] hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-[#a09dab] hover:text-white transition-colors">
              How it Works
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[#a09dab] hover:text-white hover:bg-[#252033]">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24">
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1625] border border-[#252033] mb-8">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-[#a09dab]">AI-Powered Entertainment Companion</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-['Outfit'] leading-tight mb-6">
              Your Personal{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                AI Entertainment
              </span>{" "}
              Companion
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#a09dab] max-w-2xl mx-auto mb-10">
              Tell me what you love—I&apos;ll remember forever. Get personalized recommendations,
              smart recaps, and never lose track of your favorite shows again.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-violet-500/25">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Chatting Free
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-[#252033] text-white hover:bg-[#1a1625] px-8 py-6 text-lg rounded-xl">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Chat Preview Mockup */}
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="bg-[#1a1625] rounded-2xl border border-[#252033] p-6 shadow-2xl">
              {/* Chat messages */}
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-violet-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-[80%]">
                    What should I watch tonight? Something thrilling but not too long.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#252033] text-[#e2e1e7] px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%]">
                    <p className="mb-3">Based on your love for dark thrillers, here are 3 perfect picks under 2 hours:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {["Memento", "Get Out", "Ex Machina"].map((movie) => (
                        <div key={movie} className="bg-[#1a1625] rounded-lg p-2 text-center">
                          <div className="w-full aspect-[2/3] bg-[#252033] rounded mb-2 flex items-center justify-center">
                            <Play className="w-6 h-6 text-violet-400" />
                          </div>
                          <p className="text-xs font-medium truncate">{movie}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Input */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 bg-[#252033] rounded-xl px-4 py-3 text-[#6b6873]">
                  Ask me anything about movies & shows...
                </div>
                <Button size="icon" className="bg-violet-600 hover:bg-violet-500 rounded-xl h-12 w-12">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-center mb-16">
            Why Choose CinePal?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Memory That Learns",
                description: "I remember everything you watch, love, or skip. No more repeated recommendations.",
              },
              {
                icon: MessageSquare,
                title: "Just Ask",
                description: "No complex filters. Just tell me your mood, and I'll find the perfect match.",
              },
              {
                icon: Sparkles,
                title: "Smart Recaps",
                description: "Forgot what happened last season? Get caught up in 30 seconds, spoiler-free.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#1a1625] border border-[#252033] rounded-2xl p-8 hover:border-violet-500/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center mb-6 group-hover:bg-violet-600/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold font-['Outfit'] mb-3">{feature.title}</h3>
                <p className="text-[#a09dab]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-3xl p-12 text-center border border-violet-500/20">
            <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] mb-4">
              Ready to discover your next favorite?
            </h2>
            <p className="text-[#a09dab] mb-8 max-w-xl mx-auto">
              Join thousands of entertainment lovers who never waste time scrolling again.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl">
                Get Started — It&apos;s Free
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#252033] py-8">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
                <span className="font-semibold">CinePal</span>
              </div>
              <p className="text-sm text-[#6b6873]">
                © 2026 CinePal. Your AI Entertainment Companion.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
