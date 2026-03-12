import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Car, Users, TrendingUp, Shield, Clock, CheckCircle, ArrowRight,
  Calendar, Star, Sparkles, Activity, Search, Navigation,
  CreditCard, Award, Zap, Heart, Target
} from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, bookings: 0, partners: 0, rating: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        users: prev.users < 150000 ? prev.users + 3000 : 150000,
        bookings: prev.bookings < 2500000 ? prev.bookings + 50000 : 2500000,
        partners: prev.partners < 500 ? prev.partners + 10 : 500,
        rating: prev.rating < 4.9 ? prev.rating + 0.1 : 4.9
      }));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <HeroSection />
      {/* <FloatingStatsSection stats={stats} /> */}
      <StorySection />
      <HowItWorksSection navigate={navigate} />
      <ValuesSection />
      <TeamSection />
      <CTASection navigate={navigate} />
    </div>
  );
};

// ==================== HERO SECTION ====================
const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section 
      ref={ref} 
      className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white"
    >
      {/* Subtle grid background */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f008_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f008_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div style={{ opacity }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-6"
            >
              <motion.div 
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-slate-700">Simplifying parking since 2025</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight"
            >
              About
              <br />
              <span className="text-slate-900">ParkSpace</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl"
            >
              We're eliminating the stress of finding parking. Reserve spots in seconds, 
              navigate with confidence, and pay automatically.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                <Users className="w-5 h-5 text-slate-700" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">150K+</p>
                  <p className="text-sm text-slate-600">Active Users</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                <Star className="w-5 h-5 text-slate-700" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">4.9/5</p>
                  <p className="text-sm text-slate-600">User Rating</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
              <img
                src="https://img.autocarpro.in/autocarpro/IMG/380/57380/17c556-13.jpg?w=750&h=490&q=75&c=1"
                alt="Modern Parking Facility"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
            </div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl p-5 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">2.5M+</p>
                  <p className="text-sm text-slate-600">Bookings Made</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ==================== FLOATING STATS ====================
const FloatingStatsSection = ({ stats }) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Growing every day with our community
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { label: 'Active Users', value: stats.users.toLocaleString(), suffix: '+', icon: Users, delay: 0 },
            { label: 'Bookings', value: (stats.bookings / 1000000).toFixed(1) + 'M', suffix: '+', icon: CheckCircle, delay: 0.1 },
            { label: 'Partners', value: stats.partners, suffix: '+', icon: Award, delay: 0.2 },
            { label: 'Rating', value: stats.rating.toFixed(1), suffix: '/5', icon: Star, delay: 0.3 }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-7 h-7 text-slate-900" />
              </div>
              <p className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {stat.value}{stat.suffix}
              </p>
              <p className="text-slate-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==================== STORY SECTION ====================
const StorySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg"
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO-HYPPpPjlFRZu9kzunHW4t8OR0q57jZI-A&s"
              alt="Our Story"
              className="w-full h-[500px] object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: "80px" } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="h-1 bg-slate-900 mb-6"
              />
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                Our Story
              </h2>
            </div>

            <div className="space-y-5 text-lg text-slate-600 leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
              >
                In 2025, we noticed people wasting <span className="font-semibold text-slate-900">20+ minutes daily</span> looking 
                for parking. It was frustrating and unnecessary in the digital age.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
              >
                We asked: <span className="font-semibold text-slate-900">what if booking parking was as easy as 
                ordering food?</span> That question led to ParkSpace.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 }}
              >
                Today, over 150,000 users trust us. We've saved millions of hours and reduced 
                stress for thousands of daily commuters.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 gap-5 pt-6"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <Calendar className="w-7 h-7 text-slate-900 mb-3" />
                <p className="text-3xl font-bold text-slate-900 mb-1">2025</p>
                <p className="text-slate-600 text-sm">Founded</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <TrendingUp className="w-7 h-7 text-slate-900 mb-3" />
                <p className="text-3xl font-bold text-slate-900 mb-1">200%</p>
                <p className="text-slate-600 text-sm">Growth YoY</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ==================== HOW IT WORKS ====================
const HowItWorksSection = ({ navigate }) => {
  const steps = [
    {
      number: '01',
      title: 'Search',
      description: 'Enter your destination and see available parking spots with real-time pricing',
      icon: Search,
    },
    {
      number: '02',
      title: 'Reserve',
      description: 'Select your spot and reserve instantly. Confirmation sent immediately',
      icon: Calendar,
    },
    {
      number: '03',
      title: 'Navigate',
      description: 'Follow GPS directions to your spot. Check in with QR code',
      icon: Navigation,
    },
    {
      number: '04',
      title: 'Pay',
      description: 'Park and leave. Payment processed automatically with digital receipt',
      icon: CreditCard,
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Book parking in four simple steps. Takes less than 30 seconds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
            >
              <div className="text-5xl font-bold text-slate-200 mb-4">
                {step.number}
              </div>

              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-5">
                <step.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/parking')}
            className="px-8 py-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-lg"
          >
            Start Booking Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// ==================== VALUES ====================
const ValuesSection = () => {
  const values = [
    { icon: Users, title: 'User First', description: 'Every decision starts with: how does this help our users?', },
    { icon: Zap, title: 'Speed', description: 'Time is precious. We obsess over making everything faster.', },
    { icon: Shield, title: 'Trust', description: 'Your data protected with bank-grade security. Always.', },
    { icon: Heart, title: 'Community', description: 'We listen, learn, adapt. Our community shapes our product.', },
    { icon: Sparkles, title: 'Simplicity', description: 'Complex technology, simple experience. That\'s our promise.', },
    { icon: Activity, title: 'Innovation', description: 'Constantly exploring new ways to improve parking.', }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Our Values
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-5">
                <value.icon className="w-6 h-6 text-slate-900" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{value.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==================== TEAM ====================
const TeamSection = () => {
  const team = [
    { name: 'Rajesh Kumar', role: 'Co-Founder & CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
    { name: 'Priya Sharma', role: 'Co-Founder & CTO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
    { name: 'Amit Patel', role: 'Head of Product', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
    { name: 'Sneha Reddy', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80' }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Meet Our Team
          </h2>
          <p className="text-lg text-slate-600">
            The people making parking effortless
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                  <p className="text-slate-600 text-sm">{member.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==================== CTA SECTION ====================
const CTASection = ({ navigate }) => (
  <section className="py-20 bg-gradient-to-b from-white to-slate-50">
    <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
          Ready to Stop
          <br />
          Wasting Time?
        </h2>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          Join 150,000+ users who've simplified their parking experience
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/parking')}
          className="px-8 py-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-lg"
        >
          Find Parking Now
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  </section>
);

export default AboutPage;
