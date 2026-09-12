import Link from "next/link";
import Header from "../../components/Header";

export default function ReturnPolicyPage() {
  return (
    <>
      <Header />

      <main className="policy-page">
        <section className="policy-hero">
          <span>CUSTOMER CARE</span>
          <h1>
            Returns &
            <br />
            <em>Exchanges</em>
          </h1>
          <p>
            Our approach to returns, exchanges and product concerns.
          </p>
        </section>

        <section className="policy-content">
          <div className="policy-inner">
            <article className="policy-section">
              <span className="policy-number">01</span>
              <div>
                <h2>Before Requesting a Return</h2>
                <p>
                  Please inspect your saree carefully after receiving the
                  order. If there is a problem with the product, contact our
                  team as soon as possible with your order details.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">02</span>
              <div>
                <h2>Product Condition</h2>
                <p>
                  Products requested for return or exchange should remain in
                  their original condition with the original packaging,
                  tags and accompanying materials wherever applicable.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">03</span>
              <div>
                <h2>Damaged or Incorrect Product</h2>
                <p>
                  If your order arrives damaged, defective or different from
                  what you ordered, please contact our support team with your
                  order number and clear photographs of the product and
                  packaging.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">04</span>
              <div>
                <h2>Return Approval</h2>
                <p>
                  Return or exchange requests are reviewed by our team before
                  approval. The final decision depends on the condition of the
                  product and the circumstances of the request.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">05</span>
              <div>
                <h2>Refunds</h2>
                <p>
                  Where a refund is approved, the applicable refund process
                  will depend on the payment method used for the order.
                </p>
                <p>
                  Refund processing time may vary depending on the payment
                  provider or banking institution.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">06</span>
              <div>
                <h2>Contact Us</h2>
                <p>
                  For return or exchange assistance, please contact our team
                  with your order number and the details of the issue.
                </p>

                <a
                  href="https://wa.me/916393973678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="policy-button"
                >
                  CONTACT US ON WHATSAPP →
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="policy-bottom">
          <span>YOUR TRUST MATTERS</span>

          <h2>
            Every saree deserves
            <br />
            <em>care.</em>
          </h2>

          <Link href="/sarees" className="gold-btn">
            CONTINUE SHOPPING
          </Link>
        </section>
      </main>
    </>
  );
}