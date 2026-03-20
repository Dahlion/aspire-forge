// Seacoast DevOps brand colors
// Dark slate green: #2F4F4F  |  Seafoam green: #71B5A1  |  Light seafoam: #A8D5C8

export function LandingPage() {
    const scrollTo = (id: string) =>
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    return (
        <div style={{ background: "#fff" }}>
            {/* ── Hero ── */}
            <section
                style={{
                    background: "linear-gradient(150deg, #2F4F4F 0%, #1a2e2e 100%)",
                    padding: "60px 0 50px",
                }}
            >
                <div className="container text-center text-white">
                    <img
                        src="/seacoastlogo.png"
                        alt="Seacoast DevOps"
                        style={{ maxHeight: 90, maxWidth: 320, objectFit: "contain", marginBottom: "1.5rem" }}
                    />
                    <h1 className="font-weight-bold mb-3" style={{ fontSize: "2.4rem", letterSpacing: "-0.01em" }}>
                        Modern Technology Solutions
                    </h1>
                    <p className="lead mb-4 mx-auto" style={{ color: "#A8D5C8", maxWidth: 580, fontSize: "1.1rem" }}>
                        From legacy modernization to cloud infrastructure and cybersecurity —
                        we meet you where you are and take you where you need to be.
                    </p>
                    <div className="d-flex justify-content-center flex-wrap" style={{ gap: "0.75rem" }}>
                        <button
                            className="btn btn-lg font-weight-bold px-4"
                            style={{ background: "#71B5A1", color: "#fff", border: "none", borderRadius: 6 }}
                            onClick={() => scrollTo("contact")}
                        >
                            Get In Touch
                        </button>
                        <button
                            className="btn btn-lg px-4"
                            style={{ background: "transparent", color: "#A8D5C8", border: "2px solid #71B5A1", borderRadius: 6 }}
                            onClick={() => scrollTo("services")}
                        >
                            Our Services
                        </button>
                    </div>
                    <div className="mt-4 d-flex justify-content-center flex-wrap" style={{ gap: "2rem", color: "#71B5A1", fontSize: "0.9rem" }}>
                        {[
                            { icon: "bi-check-circle-fill", label: "No-nonsense consulting" },
                            { icon: "bi-shield-check", label: "Security-first approach" },
                            { icon: "bi-lightning-charge-fill", label: "Rapid delivery" },
                        ].map(({ icon, label }) => (
                            <div key={label} className="d-flex align-items-center" style={{ gap: "0.4rem" }}>
                                <i className={`bi ${icon}`} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Services ── */}
            <section id="services" className="py-5" style={{ background: "#f4f7f6" }}>
                <div className="container py-3">
                    <div className="text-center mb-5">
                        <h2 className="font-weight-bold" style={{ color: "#2F4F4F" }}>What We Do</h2>
                        <p className="text-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
                            We work with businesses of all sizes — from small teams running Access databases
                            and Excel spreadsheets to enterprises running cloud-native infrastructure.
                        </p>
                    </div>
                    <div className="row">
                        {SERVICES.map((svc) => (
                            <div key={svc.title} className="col-md-6 col-lg-4 mb-4">
                                <div
                                    className="card h-100 border-0 shadow-sm p-3"
                                    style={{ borderRadius: 8, borderTop: "3px solid #71B5A1" }}
                                >
                                    <div className="mb-3">
                                        <span
                                            className="d-inline-flex align-items-center justify-content-center rounded-circle"
                                            style={{ width: 52, height: 52, background: "#e6f2ef" }}
                                        >
                                            <i className={`bi ${svc.icon}`} style={{ fontSize: "1.5rem", color: "#2F4F4F" }} />
                                        </span>
                                    </div>
                                    <h6 className="font-weight-bold mb-1" style={{ color: "#2F4F4F" }}>{svc.title}</h6>
                                    <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>{svc.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Us strip ── */}
            <section style={{ background: "#2F4F4F", color: "#fff", padding: "48px 0" }}>
                <div className="container">
                    <div className="row text-center">
                        {WHY_US.map((item) => (
                            <div key={item.title} className="col-6 col-md-3 mb-4 mb-md-0">
                                <i className={`bi ${item.icon} mb-2`} style={{ fontSize: "2rem", color: "#71B5A1" }} />
                                <h6 className="font-weight-bold mt-2 mb-1">{item.title}</h6>
                                <p style={{ color: "#A8D5C8", fontSize: "0.84rem", marginBottom: 0 }}>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Who We Serve ── */}
            <section id="who-we-serve" className="py-5" style={{ background: "#fff" }}>
                <div className="container py-3">
                    <div className="text-center mb-5">
                        <h2 className="font-weight-bold" style={{ color: "#2F4F4F" }}>Who We Serve</h2>
                        <p className="text-muted" style={{ maxWidth: 540, margin: "0 auto" }}>
                            We bring the same practical, results-focused approach to every sector —
                            tailored to the unique regulations, constraints, and goals of each.
                        </p>
                    </div>
                    <div className="row">
                        {CUSTOMER_BASES.map((cb) => (
                            <div key={cb.title} className="col-lg-4 mb-4">
                                <div
                                    className="card h-100 border-0 shadow-sm"
                                    style={{ borderRadius: 10, overflow: "hidden" }}
                                >
                                    {/* Card header */}
                                    <div
                                        className="p-4"
                                        style={{ background: "#2F4F4F" }}
                                    >
                                        <div className="d-flex align-items-center mb-2" style={{ gap: "0.75rem" }}>
                                            <span
                                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                style={{ width: 48, height: 48, background: "#71B5A1" }}
                                            >
                                                <i className={`bi ${cb.icon}`} style={{ fontSize: "1.4rem", color: "#fff" }} />
                                            </span>
                                            <div>
                                                <div style={{ color: "#A8D5C8", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                    {cb.sector}
                                                </div>
                                                <h5 className="font-weight-bold mb-0" style={{ color: "#fff" }}>{cb.title}</h5>
                                            </div>
                                        </div>
                                        <p style={{ color: "#A8D5C8", fontSize: "0.88rem", marginBottom: 0 }}>{cb.summary}</p>
                                    </div>
                                    {/* Services list */}
                                    <div className="card-body p-4" style={{ background: "#f4f7f6" }}>
                                        <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#71B5A1", fontWeight: 700, marginBottom: "0.75rem" }}>
                                            How we help
                                        </div>
                                        <ul className="list-unstyled mb-0">
                                            {cb.points.map((pt) => (
                                                <li key={pt} className="mb-2 d-flex align-items-start" style={{ gap: "0.5rem" }}>
                                                    <i className="bi bi-check2 mt-1 flex-shrink-0" style={{ color: "#71B5A1", fontWeight: 700 }} />
                                                    <span style={{ fontSize: "0.9rem", color: "#343a40" }}>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {/* CTA */}
                                    <div className="px-4 pb-4" style={{ background: "#f4f7f6" }}>
                                        <button
                                            className="btn btn-block btn-sm font-weight-bold"
                                            style={{ background: "#2F4F4F", color: "#fff", borderRadius: 6, border: "none" }}
                                            onClick={() => scrollTo("contact")}
                                        >
                                            Talk to Us
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="pricing" className="py-5" style={{ background: "#fff" }}>
                <div className="container py-3">
                    <div className="text-center mb-5">
                        <h2 className="font-weight-bold" style={{ color: "#2F4F4F" }}>Pricing</h2>
                        <p className="text-muted" style={{ maxWidth: 560, margin: "0 auto" }}>
                            Every engagement is different — and so is every quote.
                        </p>
                    </div>
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div
                                className="card border-0 shadow-sm p-4 p-md-5 text-center"
                                style={{ borderRadius: 12, borderTop: "4px solid #71B5A1" }}
                            >
                                <i className="bi bi-patch-check-fill mb-3" style={{ fontSize: "3rem", color: "#71B5A1" }} />
                                <h4 className="font-weight-bold mb-3" style={{ color: "#2F4F4F" }}>
                                    Custom Pricing for Every Client
                                </h4>
                                <p className="text-muted mb-4" style={{ fontSize: "1rem", maxWidth: 520, margin: "0 auto 1.5rem" }}>
                                    We don't believe in one-size-fits-all pricing. Whether you're a two-person
                                    shop looking to modernize a legacy Access database or a mid-size company
                                    building out a full cloud infrastructure, we'll scope the work together and
                                    give you a transparent, fair quote — no surprises.
                                </p>
                                <div className="row justify-content-center mb-4">
                                    {PRICING_POINTS.map((pt) => (
                                        <div key={pt} className="col-sm-6 mb-2 text-left d-flex align-items-start" style={{ gap: "0.5rem" }}>
                                            <i className="bi bi-check2-circle mt-1 flex-shrink-0" style={{ color: "#71B5A1" }} />
                                            <span style={{ fontSize: "0.92rem" }}>{pt}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="btn btn-lg font-weight-bold px-5"
                                    style={{ background: "#2F4F4F", color: "#fff", border: "none", borderRadius: 6 }}
                                    onClick={() => scrollTo("contact")}
                                >
                                    Request a Free Quote
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Contact ── */}
            <section id="contact" className="py-5" style={{ background: "#f4f7f6" }}>
                <div className="container py-3">
                    <div className="text-center mb-5">
                        <h2 className="font-weight-bold" style={{ color: "#2F4F4F" }}>Get In Touch</h2>
                        <p className="text-muted">Ready to get started? We'd love to hear about your project.</p>
                    </div>
                    <div className="row justify-content-center">
                        <div className="col-lg-6 mb-4">
                            <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 10 }}>
                                <h6 className="font-weight-bold mb-4" style={{ color: "#2F4F4F" }}>Send Us a Message</h6>
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <div className="form-row">
                                        <div className="col-md-6 form-group">
                                            <label className="font-weight-bold small">First Name</label>
                                            <input type="text" className="form-control" placeholder="Jane" />
                                        </div>
                                        <div className="col-md-6 form-group">
                                            <label className="font-weight-bold small">Last Name</label>
                                            <input type="text" className="form-control" placeholder="Smith" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="font-weight-bold small">Email</label>
                                        <input type="email" className="form-control" placeholder="jane@company.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="font-weight-bold small">What can we help with?</label>
                                        <select className="form-control">
                                            <option value="">Select a service…</option>
                                            {SERVICES.map((s) => (
                                                <option key={s.title}>{s.title}</option>
                                            ))}
                                            <option>General Inquiry</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="font-weight-bold small">Message</label>
                                        <textarea className="form-control" rows={4} placeholder="Tell us about your project…" />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-block font-weight-bold"
                                        style={{ background: "#2F4F4F", color: "#fff", borderRadius: 6 }}
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="col-lg-4 mb-4">
                            <div className="card shadow-sm border-0 p-4 h-100" style={{ borderRadius: 10, background: "#2F4F4F" }}>
                                <img
                                    src="/seacoastlogo.png"
                                    alt="Seacoast DevOps"
                                    style={{ maxHeight: 60, objectFit: "contain", marginBottom: "1.25rem" }}
                                />
                                <h6 className="font-weight-bold mb-4" style={{ color: "#71B5A1" }}>Contact Info</h6>
                                {CONTACT_INFO.map((item) => (
                                    <div key={item.label} className="d-flex mb-3" style={{ gap: "0.75rem" }}>
                                        <i className={`bi ${item.icon} mt-1`} style={{ color: "#71B5A1", fontSize: "1.1rem", flexShrink: 0 }} />
                                        <div>
                                            <div style={{ color: "#A8D5C8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                {item.label}
                                            </div>
                                            <div style={{ color: "#fff", fontSize: "0.92rem" }}>{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                                <hr style={{ borderColor: "#3d6363" }} />
                                <div style={{ color: "#A8D5C8", fontSize: "0.84rem" }}>
                                    <div className="font-weight-bold mb-1" style={{ color: "#71B5A1", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Response Time
                                    </div>
                                    We typically respond within one business day.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ background: "#1a2e2e", color: "#71B5A1", padding: "1.5rem 0" }}>
                <div className="container d-flex flex-wrap align-items-center justify-content-between" style={{ gap: "0.5rem" }}>
                    <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                        <img src="/seacoastlogo.png" alt="" style={{ maxHeight: 32, objectFit: "contain" }} />
                        <span style={{ color: "#A8D5C8", fontSize: "0.82rem" }}>
                            &copy; {new Date().getFullYear()} Seacoast DevOps. All rights reserved.
                        </span>
                    </div>
                    <div style={{ fontSize: "0.82rem" }}>
                        <a href="#" style={{ color: "#71B5A1", marginRight: "1rem" }} onClick={(e) => { e.preventDefault(); scrollTo("services"); }}>Services</a>
                        <a href="#" style={{ color: "#71B5A1", marginRight: "1rem" }} onClick={(e) => { e.preventDefault(); scrollTo("pricing"); }}>Pricing</a>
                        <a href="#" style={{ color: "#71B5A1" }} onClick={(e) => { e.preventDefault(); scrollTo("contact"); }}>Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const SERVICES = [
    {
        icon: "bi-arrow-up-right-circle-fill",
        title: "Legacy Modernization",
        description:
            "Still on Access databases, Excel sheets, or old desktop software? We migrate and modernize your workflows into reliable, scalable modern systems — no disruption to your day-to-day.",
    },
    {
        icon: "bi-cloud-upload-fill",
        title: "Cloud Infrastructure",
        description:
            "Design, build, and manage cloud environments on AWS, Azure, or GCP with infrastructure-as-code so everything is repeatable and auditable.",
    },
    {
        icon: "bi-arrow-repeat",
        title: "CI/CD & DevOps Pipelines",
        description:
            "Automated build, test, and deployment pipelines that get your code to production faster and with confidence.",
    },
    {
        icon: "bi-shield-lock-fill",
        title: "Cybersecurity Consulting",
        description:
            "Threat assessments, security architecture reviews, vulnerability management, and compliance guidance for SOC 2, HIPAA, and more.",
    },
    {
        icon: "bi-people-fill",
        title: "Software Consulting",
        description:
            "Not sure what to build or how to build it? We help you define requirements, evaluate options, and make smart technical decisions.",
    },
    {
        icon: "bi-boxes",
        title: "Containers & Kubernetes",
        description:
            "Containerize your applications and run them on managed Kubernetes clusters with proper monitoring, scaling, and security baked in.",
    },
];

const WHY_US = [
    { icon: "bi-hand-thumbs-up-fill", title: "Plain English", body: "We explain tech without the jargon." },
    { icon: "bi-graph-up-arrow", title: "Proven Results", body: "Real outcomes, not slide decks." },
    { icon: "bi-lightbulb-fill", title: "Practical First", body: "We recommend what makes sense for you." },
    { icon: "bi-headset", title: "Responsive", body: "You'll always know where things stand." },
];

const PRICING_POINTS = [
    "Free initial consultation",
    "Fixed-fee or retainer options",
    "No long-term lock-in contracts",
    "Scalable as your needs grow",
    "Transparent scope and milestones",
    "Small business friendly",
];

const CUSTOMER_BASES = [
    {
        sector: "Public Sector",
        title: "Government",
        icon: "bi-building-fill",
        summary:
            "We understand the unique demands of government IT — tight budgets, strict compliance requirements, and systems that can't go down. We help agencies modernize without disrupting operations.",
        points: [
            "Legacy system migration (Access, Excel, on-premise servers)",
            "FedRAMP-aligned cloud architecture",
            "FISMA & NIST cybersecurity compliance",
            "Secure software development practices",
            "Open-source and cost-effective tooling",
            "Procurement-friendly engagement models",
        ],
    },
    {
        sector: "Healthcare",
        title: "Healthcare",
        icon: "bi-hospital-fill",
        summary:
            "Patient data is among the most sensitive information that exists. We help healthcare organizations modernize and innovate while keeping HIPAA compliance and data security front and center.",
        points: [
            "HIPAA-compliant cloud infrastructure",
            "Secure data pipelines and integrations",
            "EHR and legacy application modernization",
            "Vulnerability assessments and pen testing",
            "Disaster recovery and business continuity",
            "Staff training on security best practices",
        ],
    },
    {
        sector: "Commercial",
        title: "Private Business",
        icon: "bi-briefcase-fill",
        summary:
            "From small shops still running on spreadsheets to mid-size companies ready to scale, we help private businesses adopt the right technology at the right pace — no over-engineering, no unnecessary complexity.",
        points: [
            "Modernize Excel/Access workflows into real apps",
            "Cost-optimized cloud migrations",
            "CI/CD pipelines for faster software delivery",
            "Cybersecurity audits and risk reduction",
            "Software architecture consulting",
            "Flexible retainer or project-based engagements",
        ],
    },
];

const CONTACT_INFO = [
    { icon: "bi-telephone-fill", label: "Phone", value: "207-754-7557" },
    { icon: "bi-envelope-fill", label: "Email", value: "dannclark25@gmail.com" },
];
