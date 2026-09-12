import Link from "next/link";
import Header from "../../components/Header";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="about-page">
        {/* HERO */}
        <section className="about-hero">
          <div className="about-hero-inner">
            <span className="about-eyebrow">KASHI BANARAS</span>

            <h1>
              Woven with
              <br />
              <em>heritage.</em>
            </h1>

            <p>
              Every Kashi Banaras saree carries the patience of a master
              weaver, the beauty of Banaras, and a tradition passed down
              through generations.
            </p>
          </div>
        </section>

        {/* STORY */}
        <section className="about-story">
          <div className="about-story-grid">
            <div className="about-story-content">
              <span className="about-eyebrow">
                ROOTED IN TRADITION
              </span>

              <h2>
                Crafted with
                <br />
                <em>passion.</em>
              </h2>

              <p>
                Banarasi weaving is more than a craft. It is a tradition
                built with patience, precision and passion.
              </p>

              <p>
                At Kashi Banaras, we celebrate the artistry behind every
                saree. From intricate zari work to timeless motifs, every
                thread reflects the skill and dedication of the artisans
                who bring these beautiful creations to life.
              </p>

              <p>
                Our vision is simple — to bring the elegance of authentic
                Banarasi craftsmanship to modern wardrobes while
                respecting the heritage that makes every weave special.
              </p>
            </div>

            <div className="about-story-panel">
              <div className="about-stat">
                <strong>500+</strong>
                <span>ARTISANS</span>
              </div>

              <div className="about-stat">
                <strong>100+</strong>
                <span>DESIGNS</span>
              </div>

              <div className="about-stat">
                <strong>10K+</strong>
                <span>HAPPY CUSTOMERS</span>
              </div>

              <div className="about-stat">
                <strong>25+</strong>
                <span>YEARS OF LEGACY</span>
              </div>
            </div>
          </div>
        </section>

        {/* CRAFT */}
        <section className="about-craft">
          <div className="about-craft-inner">
            <span className="about-eyebrow">
              THE ART OF WEAVING
            </span>

            <h2>
              Every thread tells
              <br />
              <em>a story.</em>
            </h2>

            <div className="about-craft-text">
              <p>
                A Banarasi saree is the result of countless hours of
                careful craftsmanship. The designs, motifs, zari and
                colours come together to create something that is meant
                to be treasured.
              </p>

              <p>
                We believe that traditional craftsmanship deserves a
                place in the modern world. That is why Kashi Banaras
                brings together timeless Banarasi aesthetics with a
                refined shopping experience.
              </p>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="about-values">
          <div className="about-values-header">
            <span className="about-eyebrow">
              WHAT WE BELIEVE
            </span>

            <h2>
              Tradition.
              <br />
              <em>Quality. Trust.</em>
            </h2>
          </div>

          <div className="about-values-grid">
            <article>
              <span>01</span>
              <h3>Authentic Craftsmanship</h3>
              <p>
                We value the traditional techniques and detailed
                workmanship that make Banarasi sarees unique.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Timeless Design</h3>
              <p>
                Our designs respect traditional motifs while bringing
                an elegant and contemporary feel to every collection.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Customer Trust</h3>
              <p>
                From discovering a saree to receiving it at your
                doorstep, we aim to make every experience simple and
                reliable.
              </p>
            </article>
          </div>
        </section>

        {/* CLOSING */}
        <section className="about-closing">
          <div>
            <span className="about-eyebrow">
              KASHI BANARAS
            </span>

            <h2>
              Pure Banarasi.
              <br />
              <em>Modern heirlooms.</em>
            </h2>

            <p>
              Discover sarees that carry the soul of Banaras and the
              beauty of generations of craftsmanship.
            </p>

            <Link href="/sarees" className="gold-btn">
              EXPLORE SAREES
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}