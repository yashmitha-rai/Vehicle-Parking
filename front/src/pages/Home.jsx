import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Car, Clock, Shield, ChevronRight, Users, Search,
  CreditCard, CheckCircle, ArrowRight,
  Mail, Linkedin, Twitter, Zap, Lock,
  Calendar, Wallet, Award, Star, Sparkles, Bell, TrendingUp, RefreshCw, MapPin, Info
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, bookings: 0, partners: 0, rating: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        users: prev.users < 150000 ? prev.users + 3000 : 150000,
        bookings: prev.bookings < 2500000 ? prev.bookings + 50000 : 2500000,
        partners: prev.partners < 5000 ? prev.partners + 100 : 5000,
        rating: prev.rating < 4.9 ? prev.rating + 0.1 : 4.9
      }));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection navigate={navigate} />
      <LogoBar />
      <FeaturesSection />
      <HowItWorksSection navigate={navigate} />
      <TestimonialsSection />
      <SecuritySection />
    </div>
  );
};

// ==================== NAVIGATION ====================
const Navigations = ({ navigate }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm' : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center"
            >
              <Car className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-slate-900">ParkSpace</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'Pricing', 'Support'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
              >
                {link}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/parking')}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow-md"
            >
              Find parking
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

// ==================== HERO SECTION ====================
const HeroSection = ({ navigate }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);


  return (
    <section ref={ref} className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"></div>


      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl"
      />


      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-8 shadow-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
            <span className="text-sm font-medium text-slate-700">Live availability tracking</span>
          </motion.div>


          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight"
          >
            Find parking,
            <br />
            skip the hassle
          </motion.h1>


          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl lg:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Reserve verified parking spots in seconds. Navigate with confidence. Pay automatically when you leave.
          </motion.p>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/parking')}
              className="px-8 py-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2 group"
            >
              Find parking now
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>


            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/about')}
              className="px-8 py-4 bg-white text-slate-900 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center gap-2"
            >
              See how it works
            </motion.button>
          </motion.div>


          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600"
          >
            {[
              { icon: CheckCircle, text: 'No subscription required' },
              { icon: Clock, text: 'Instant confirmation' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-slate-400" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>


        {/* Hero Visual - Mockup Preview (Faded) */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, type: "spring" }}
          style={{ y }}
          className="mt-20 max-w-6xl mx-auto"
        >
          {/* Added opacity-80 to make it slightly faded */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-2xl bg-white opacity-80">
            {/* Browser chrome */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 ml-4 px-4 py-1.5 bg-white rounded-md border border-gray-200 text-xs text-slate-500 font-mono flex items-center gap-2">
                <Lock className="w-3 h-3" />
                parkspace.com/book
              </div>
            </div>


            {/* Parking Cards Mockup */}
            <div className="bg-white p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Available Parking Spots</h2>
                <p className="text-slate-600">Select your preferred parking location</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { slotNo: 'A-42', name: 'Premium Tower', price: '₹80', available: 12, rating: 4.8 },
                  { slotNo: 'B-15', name: 'Business Hub', price: '₹60', available: 24, rating: 4.6 },
                  { slotNo: 'C-08', name: 'Quick Park', price: '₹50', available: 8, rating: 4.5 },
                  { slotNo: 'D-23', name: 'Mall Parking', price: '₹70', available: 15, rating: 4.7 },
                  { slotNo: 'E-31', name: 'Metro Station', price: '₹45', available: 20, rating: 4.4 },
                  { slotNo: 'F-19', name: 'Airport Plaza', price: '₹100', available: 30, rating: 4.9 }
                ].map((spot, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-slate-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="inline-block px-3 py-1 bg-slate-900 text-white text-sm font-bold rounded-lg mb-2">
                          Slot {spot.slotNo}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{spot.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-slate-900">{spot.rating}</span>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        {spot.available} spots available
                      </span>
                    </div>

                    {/* Price and Book Button */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-3xl font-black text-slate-900">{spot.price}</div>
                        <div className="text-xs text-slate-500 font-medium">per hour</div>
                      </div>
                      <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg shadow-md flex items-center gap-2 pointer-events-none">
                        Book Now
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>





          {/* Floating Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, type: "spring" }}
            className="absolute -right-4 bottom-32 bg-white rounded-xl shadow-xl p-4 border-2 border-blue-200 max-w-[220px] hidden lg:block opacity-90"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pay on Exit</p>
                <p className="text-sm font-bold text-slate-900">Auto-debit</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">No upfront payment needed</p>
          </motion.div>
        </motion.div>


      </div>
    </section>
  );
};

// ==================== LOGO BAR ====================
const LogoBar = () => {
  const logos = ['TechCorp', 'InnovateLabs', 'BuildCo', 'NextGen', 'FutureTech', 'DataFlow'];

  return (
    <section className="py-16 border-y border-gray-200 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-slate-500 mb-8"
        >
          Trusted by forward-thinking organizations
        </motion.p>

        {/* Infinite scroll animation */}
        <div className="relative">
          <motion.div
            animate={{ x: [0, -1920] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-16"
          >
            {[...logos, ...logos, ...logos].map((company, idx) => (
              <div key={idx} className="text-2xl font-bold text-slate-900 opacity-40 hover:opacity-100 transition-opacity whitespace-nowrap">
                {company}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ==================== STATS SECTION ====================
const StatsSection = ({ stats }) => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {[
          { label: 'Active users', value: stats.users.toLocaleString(), suffix: '+', icon: Users, gradient: 'from-blue-500 to-indigo-500' },
          { label: 'Bookings completed', value: (stats.bookings / 1000000).toFixed(1) + 'M', suffix: '+', icon: CheckCircle, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Parking partners', value: stats.partners.toLocaleString(), suffix: '+', icon: Sparkles, gradient: 'from-purple-500 to-pink-500' },
          { label: 'Average rating', value: stats.rating.toFixed(1), suffix: '/5', icon: Star, gradient: 'from-yellow-500 to-orange-500' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="text-center group"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </motion.div>
            <motion.p
              className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2"
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {stat.value}{stat.suffix}
            </motion.p>
            <p className="text-slate-600 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ==================== FEATURES SECTION ====================
const FeaturesSection = () => {
  const features = [
    {
      icon: Search,
      title: 'Instant Search',
      description: 'Find available parking spots in real-time. Advanced filters for price, amenities, and availability.',
      stats: ['5000+ spots', '99.9% uptime'],
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Zap,
      title: 'Smart Booking',
      description: 'Reserve your spot in under 30 seconds. Instant confirmation and digital access codes.',
      stats: ['< 30s booking', 'Auto-confirm'],
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Wallet,
      title: 'Seamless Payments',
      description: 'Pay automatically when you leave. Support for all payment methods with instant receipts.',
      stats: ['Auto-pay', 'Multi-method'],
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Lock,
      title: 'Verified & Safe',
      description: 'All parking facilities verified with 24/7 security monitoring and customer support.',
      stats: ['100% verified', '24/7 support'],
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Features</span>
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Everything you need
          </h2>
          <p className="text-xl text-slate-600 font-normal">
            A complete parking solution designed for convenience and peace of mind.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{feature.description}</p>
              <div className="flex gap-3">
                {feature.stats.map((stat, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-bold text-slate-700 group-hover:bg-slate-100 transition-colors"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
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
      description: 'Browse available parking spots with real-time pricing and availability updates.',
      icon: Search,
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      number: '02',
      title: 'Reserve',
      description: 'Select your spot and complete booking instantly. Confirmation sent immediately.',
      icon: Calendar,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      number: '03',
      title: 'Access',
      description: 'Arrive at your spot and use QR code for contactless entry and verification.',
      icon: Bell,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      number: '04',
      title: 'Pay',
      description: 'Leave when ready. Payment processed automatically with instant digital receipt.',
      icon: CreditCard,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-gray-200 rounded-full mb-6"
          >
            <Zap className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Simple process</span>
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            How it works
          </h2>
          <p className="text-xl text-slate-600 font-normal">
            Book parking in four simple steps. The entire process takes less than 30 seconds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-slate-50 rounded-xl p-6 border border-gray-200 h-full hover:border-gray-300 hover:shadow-lg transition-all group"
              >
                <div className="text-6xl font-black text-slate-100 mb-4">{step.number}</div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-12 h-12 bg-gradient-to-br ${step.gradient} rounded-lg flex items-center justify-center mb-4 shadow-md`}
                >
                  <step.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </motion.div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-gray-200"></div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/parking')}
            className="px-8 py-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            Start booking now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// ==================== TESTIMONIALS ====================
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "ParkSpace completely transformed my daily commute. I used to waste 20 minutes looking for parking. Now I just book ahead and drive straight there.",
      author: "Rajesh Kumar",
      role: "Software Engineer",
      company: "Tech Startup",
      rating: 5,
      avatar: "RK"
    },
    {
      quote: "The automatic payment feature is brilliant. No more fumbling for change or dealing with meters. Everything happens seamlessly in the background.",
      author: "Priya Menon",
      role: "Marketing Director",
      company: "E-commerce",
      rating: 5,
      avatar: "PM"
    },
    {
      quote: "I've been using ParkSpace for 8 months now. The reliability is outstanding, and their support team actually responds when you need help.",
      author: "Amit Sharma",
      role: "Business Consultant",
      company: "Consulting Firm",
      rating: 5,
      avatar: "AS"
    },
    {
      quote: "Finally, a parking solution that actually works. The real-time updates are accurate, and I've never had a booking issue. Absolutely worth it.",
      author: "Neha Patel",
      role: "Product Manager",
      company: "SaaS Company",
      rating: 5,
      avatar: "NP"
    },
    {
      quote: "Game changer for my business travel. I can pre-book parking near client offices and arrive stress-free. The ROI in time saved is incredible.",
      author: "Vikram Singh",
      role: "Sales Director",
      company: "Enterprise Corp",
      rating: 5,
      avatar: "VS"
    }
  ];

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-slate-700">4.9/5 from 15,000+ reviews</span>
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Loved by thousands
          </h2>
          <p className="text-xl text-slate-600 font-normal">
            See what our users have to say about their experience.
          </p>
        </motion.div>

        {/* Infinite Scroll Container */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling Testimonials */}
          <motion.div
            className="flex gap-6"
            animate={{
              x: [0, -1800], // Adjust based on card width
            }}
            transition={{
              x: {
                duration: 40,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-white rounded-xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all flex-shrink-0 w-[400px] cursor-pointer"
              >
                <div className="flex gap-1 mb-6">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-slate-900 text-slate-900" />
                  ))}
                </div>

                <p className="text-slate-700 leading-relaxed mb-8 text-base">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.author}</p>
                    <p className="text-xs text-slate-500">{testimonial.role} · {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Optional: Pause on hover version */}
        {/* Add this to the motion.div if you want pause on hover:
        onMouseEnter={() => {
          // Pause animation logic
        }}
        onMouseLeave={() => {
          // Resume animation logic
        }}
        */}
      </div>
    </section>
  );
};


// ==================== SECURITY SECTION ====================
const SecuritySection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Bank-level Security',
      description: 'All transactions encrypted with industry-standard protocols',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Lock,
      title: 'Data Protection',
      description: 'Your information is never shared with third parties',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      title: 'Verified Partners',
      description: 'Every parking facility verified and monitored',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock assistance for any issues',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-gray-200 rounded-full mb-6"
          >
            <Shield className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Enterprise security</span>
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Safe & secure
          </h2>
          <p className="text-xl text-slate-600 font-normal">
            Your safety and security are our top priorities.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="bg-slate-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==================== CTA SECTION ====================
const CTASection = ({ navigate }) => (
  <section className="py-24 bg-slate-900 relative overflow-hidden">
    {/* Animated background */}
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.2, 0.1]
      }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl"
    />

    <div className="container mx-auto px-6 lg:px-12 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to simplify parking?
          </h2>
          <p className="text-xl text-slate-300 mb-10 font-normal">
            Join 150,000+ users who've transformed their parking experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/parking')}
              className="px-8 py-4 bg-white text-slate-900 font-medium rounded-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl inline-flex items-center justify-center gap-2"
            >
              Get started free
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2"
            >
              Contact sales
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ==================== FOOTER ====================
const Footer = () => (
  <footer className="bg-white border-t border-gray-200 py-16">
    <div className="container mx-auto px-6 lg:px-12">
      <div className="grid md:grid-cols-5 gap-12 mb-16">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">ParkSpace</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Making parking simple and stress-free for everyone.
          </p>
          <div className="flex gap-3">
            {[Twitter, Linkedin, Mail].map((Icon, index) => (
              <motion.a
                key={index}
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-600 group-hover:text-white" />
              </motion.a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 mb-4">Product</h3>
          <ul className="space-y-3">
            {['Features', 'Pricing', 'How it works', 'FAQ'].map(link => (
              <li key={link}>
                <a href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 mb-4">Company</h3>
          <ul className="space-y-3">
            {['About', 'Blog', 'Careers', 'Press'].map(link => (
              <li key={link}>
                <a href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 mb-4">Support</h3>
          <ul className="space-y-3">
            {['Help Center', 'Contact', 'Partners', 'Legal'].map(link => (
              <li key={link}>
                <a href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-600 text-sm">© 2025 ParkSpace. All rights reserved.</p>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Cookies'].map(link => (
            <a key={link} href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
              {link}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default HomePage;
