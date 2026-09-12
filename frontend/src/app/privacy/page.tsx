import Link from "next/link";
import Header from "../../components/Header";

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="policy-page">
        <section className="policy-hero">
          <span>YOUR PRIVACY</span>
          <h1>
            Privacy
            <br />
            <em>Policy</em>
          </h1>
          <p>
            How information provided through Kashi Banaras is handled.
          </p>
        </section>

        <section className="policy-content">
          <div className="policy-inner">
            <article className="policy-section">
              <span className="policy-number">01</span>
              <div>
                <h2>Information We Collect</h2>
                <p>
                  When you create an account, place an order or contact us,
                  information such as your name, phone number, email address,
                  delivery address and order details may be collected.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">02</span>
              <div>
                <h2>How We Use Your Information</h2>
                <p>
                  Your information may be used to process orders, deliver
                  products, provide customer support, manage your account and
                  communicate with you about your orders.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">03</span>
              <div>
                <h2>Payment Information</h2>
                <p>
                  Payment processing information is handled through the
                  applicable payment service used during checkout. Sensitive
                  payment credentials should not be shared directly with
                  Kashi Banaras.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">04</span>
              <div>
                <h2>Information Security</h2>
                <p>
                  We take reasonable measures to protect account and order
                  information from unauthorized access, misuse or disclosure.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">05</span>
              <div>
                <h2>Third-Party Services</h2>
                <p>
                  Certain services required to operate the website, such as
                  payment processing, image hosting, delivery and technical
                  infrastructure, may process information necessary to
                  provide those services.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">06</span>
              <div>
                <h2>Your Choices</h2>
                <p>
                  If you have questions about your account information or
                  would like assistance regarding information associated with
                  your orders, please contact our support team.
                </p>

                <a
                  href="https://wa.me/916393973678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="policy-button"
                >
                  CONTACT SUPPORT →
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="policy-bottom">
          <span>KASHI BANARAS</span>

          <h2>
            Your trust.
            <br />
            <em>Our responsibility.</em>
          </h2>

          <Link href="/sarees" className="gold-btn">
            EXPLORE SAREES
          </Link>
        </section>
      </main>
    </>
  );
}