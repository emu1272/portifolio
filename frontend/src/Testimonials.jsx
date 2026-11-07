import { useState, useEffect, useRef } from "react";
import "./Testimonials.css";

const testimonials = [
  {
    id: 1,
    name: "Abebe Kebede",
    role: "Senior Software Engineer",
    company: "Tech Company",
    text: "Emebet is a fast learner with strong problem-solving skills. She built a full-stack web application that impressed our entire team. Her dedication and attention to detail are remarkable.",
    avatar: "AK",
    color: "#38bdf8",
  },
  {
    id: 2,
    name: "Tigist Haile",
    role: "Web Development Instructor",
    company: "Wollo University",
    text: "One of the most motivated students I have taught. Emebet consistently delivers high-quality projects and always goes beyond what is required. She has a bright future in software development.",
    avatar: "TH",
    color: "#a78bfa",
  },
  {
    id: 3,
    name: "Dawit Tesfaye",
    role: "Project Manager",
    company: "Startup Ethiopia",
    text: "Working with Emebet on our web project was a great experience. She is professional, communicates well, and delivers on time. Her React and Node.js skills are impressive for her level.",
    avatar: "DT",
    color: "#34d399",
  },
  {
    id: 4,
    name: "Meron Alemu",
    role: "CS Student",
    company: "Wollo University",
    text: "Emebet helped me understand web development concepts that I struggled with for weeks. She explains things clearly and is always willing to help her classmates.",
    avatar: "MA",
    color: "#f59e0b",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef(null);

  function goTo(index) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(index);
      setAnimating(false);
    }, 300);
  }

  function next() {
    goTo((active + 1) % testimonials.length);
  }

  function prev() {
    goTo((active - 1 + testimonials.length) % testimonials.length);
  }

  // Auto-slide every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const t = testimonials[active];

  return (
    <section className="testimonials-section page-fade">
      <p className="eyebrow">WHAT PEOPLE SAY</p>
      <h1>Testimonials</h1>
      <p className="testimonials-subtitle">
        Feedback from colleagues, instructors, and collaborators.
      </p>

      <div className="testimonials-wrapper">
        {/* Card */}
        <div className={`testimonial-card ${animating ? "fade-out" : "fade-in"}`}>
          {/* Quote icon */}
          <div className="quote-icon">"</div>

          <p className="testimonial-text">{t.text}</p>

          <div className="testimonial-author">
            <div
              className="testimonial-avatar"
              style={{ background: t.color }}
            >
              {t.avatar}
            </div>
            <div>
              <strong>{t.name}</strong>
              <p>{t.role}</p>
              <p className="testimonial-company">{t.company}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="testimonial-controls">
          <button className="testimonial-arrow" onClick={prev} aria-label="Previous">
            ←
          </button>

          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === active ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to ${i + 1}`}
              />
            ))}
          </div>

          <button className="testimonial-arrow" onClick={next} aria-label="Next">
            →
          </button>
        </div>
      </div>
    </section>
  );
}
