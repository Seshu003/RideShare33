"use client";
import React, { useState } from "react";

function MainComponent({ currentPage, brandName = "RideShare", onSignIn }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Find a Ride" },
    { href: "/create-ride", label: "Offer a Ride" },
    { href: "/dashboard", label: "Dashboard" }
  ];

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <i className="fas fa-car-side text-2xl text-gray-900 dark:text-white"></i>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-inter">
                {brandName}
              </span>
            </a>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={`${
                  currentPage === link.href
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                } font-inter transition-colors`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button
              type="button"
              onClick={onSignIn}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-inter"
            >
              Sign In
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${
                    currentPage === link.href
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  } font-inter block px-2 py-1 rounded-md transition-colors`}
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={onSignIn}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-inter w-full"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function NavigationBar(props) {
  return <MainComponent {...props} />;
}

function StoryComponent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Default Navigation</h2>
        <MainComponent currentPage="/" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Active Page: Find a Ride</h2>
        <MainComponent currentPage="/search" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Custom Brand Name</h2>
        <MainComponent currentPage="/" brandName="TravelShare" />
      </div>

      <div className="bg-gray-900 p-4">
        <h2 className="text-xl font-bold mb-4 text-white">Dark Mode</h2>
        <MainComponent currentPage="/dashboard" />
      </div>
    </div>
  );
}