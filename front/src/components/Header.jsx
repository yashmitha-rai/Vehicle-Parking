import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Car, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Parking", path: "/parking" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact"},
];

const Navigations = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="h-20 flex items-center justify-between">
            
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                ParkSpace
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative text-sm font-medium transition-colors ${
                      active
                        ? "text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.name}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-2 left-0 right-0 h-[2px] bg-slate-900 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* CTA + MOBILE BUTTON */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/parking")}
                className="hidden sm:inline-flex px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-lg hover:bg-slate-800 transition-all"
              >
                Find Parking
              </motion.button>

              {/* Mobile Toggle */}
              <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-6 h-6 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold text-slate-900">
                  ParkSpace
                </span>
                <button onClick={() => setOpen(false)}>
                  <X className="w-6 h-6 text-slate-700" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {navLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`text-base font-medium ${
                      location.pathname === item.path
                        ? "text-slate-900"
                        : "text-slate-600"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/parking");
                  }}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium shadow-lg"
                >
                  Find Parking
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigations;
