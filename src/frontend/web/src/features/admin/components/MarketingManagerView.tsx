import { useState } from "react";

type Tab = "campaigns" | "platforms" | "content";

function ComingSoonCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="card border-secondary h-100">
            <div className="card-body text-center py-4 text-muted">
                <i className={`bi ${icon} display-4 d-block mb-3`} />
                <h6 className="font-weight-bold">{title}</h6>
                <p className="small mb-3">{description}</p>
                <span className="badge badge-warning px-3 py-2" style={{ fontSize: "0.85rem" }}>
                    <i className="bi bi-hammer mr-1" /> Coming Soon
                </span>
            </div>
        </div>
    );
}

export function MarketingManagerView() {
    const [tab, setTab] = useState<Tab>("campaigns");

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div>
                    <h4 className="mb-0 font-weight-bold">
                        <i className="bi bi-megaphone-fill mr-2 text-primary" />
                        Marketing Manager
                    </h4>
                    <small className="text-muted">
                        Design and publish marketing content across platforms — campaigns, social media, and brand assets.
                    </small>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "campaigns" ? "active" : ""}`}
                        onClick={() => setTab("campaigns")}
                    >
                        <i className="bi bi-lightning-charge mr-1" />
                        Campaigns
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "platforms" ? "active" : ""}`}
                        onClick={() => setTab("platforms")}
                    >
                        <i className="bi bi-share mr-1" />
                        Platforms
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "content" ? "active" : ""}`}
                        onClick={() => setTab("content")}
                    >
                        <i className="bi bi-palette mr-1" />
                        Content &amp; Assets
                    </button>
                </li>
            </ul>

            {tab === "campaigns" && (
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <ComingSoonCard
                            icon="bi-calendar3"
                            title="Campaign Scheduler"
                            description="Plan, schedule, and track marketing campaigns with start/end dates, target audiences, and goal tracking across all channels."
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <ComingSoonCard
                            icon="bi-bar-chart-line"
                            title="Campaign Analytics"
                            description="View reach, engagement, and conversion metrics per campaign with comparison across time periods."
                        />
                    </div>
                </div>
            )}

            {tab === "platforms" && (
                <div>
                    <div className="alert alert-info mb-4">
                        <i className="bi bi-info-circle-fill mr-2" />
                        Connect and publish to social media platforms and other marketing channels from one place.
                    </div>
                    <div className="row">
                        {[
                            { icon: "bi-linkedin", title: "LinkedIn", desc: "Post updates, job listings, and company news." },
                            { icon: "bi-twitter-x", title: "X / Twitter", desc: "Schedule tweets and thread campaigns." },
                            { icon: "bi-facebook", title: "Facebook", desc: "Page posts, events, and ad integration." },
                            { icon: "bi-envelope-fill", title: "Email Marketing", desc: "Newsletters and drip campaigns via MailKit." },
                        ].map(p => (
                            <div key={p.title} className="col-md-6 mb-3">
                                <ComingSoonCard icon={p.icon} title={p.title} description={p.desc} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "content" && (
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <ComingSoonCard
                            icon="bi-image"
                            title="Brand Assets"
                            description="Manage logos, color palettes, fonts, and brand kit files in one centralized library."
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <ComingSoonCard
                            icon="bi-layout-text-window-reverse"
                            title="Content Designer"
                            description="Design posts, banners, and email templates with a visual editor and export to multiple platform formats."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
