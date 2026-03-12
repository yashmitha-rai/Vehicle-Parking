import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Parking', path: '/parking' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const features = [
    'Real-time Slot Tracking',
    'EV Charging Stations',
    'Digital Token System',
    'Automated Billing',
  ];

  const contactInfo = [
    { icon: Mail, text: 'support@smartparking.com', href: 'mailto:support@smartparking.com' },
    { icon: Phone, text: '+91 9876543210', href: 'tel:+919876543210' },
    { icon: MapPin, text: 'Mangalore, India', href: '#' },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-16">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <Car className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-xl font-bold tracking-tight">ParkSpace</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Modern parking management system with real-time slot tracking, EV charging support, and automated billing.
            </p>
            <div className="flex items-center gap-3">
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="text-base font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div className="lg:col-span-3">
            <h3 className="text-base font-semibold mb-4 text-white">Features</h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-base font-semibold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3">
              {contactInfo.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <item.icon className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    <span>{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700/50 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 text-center md:text-left">
              © {currentYear} ParkSpace. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/privacy"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
