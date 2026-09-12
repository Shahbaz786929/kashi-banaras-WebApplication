import Link from "next/link";
import Header from "../../components/Header";

export default function ShippingPolicyPage() {
  return (
    <>
      <Header />

      <main className="policy-page">
        <section className="policy-hero">
          <span>DELIVERY INFORMATION</span>
          <h1>
            Shipping
            <br />
            <em>Policy</em>
          </h1>
          <p>
            Everything you need to know about receiving your Kashi Banaras
            order.
          </p>
        </section>

        <section className="policy-content">
          <div className="policy-inner">
            <article className="policy-section">
              <span className="policy-number">01</span>
              <div>
                <h2>Order Processing</h2>
                <p>
                  Once your order is successfully placed, our team begins
                  preparing your saree for dispatch.
                </p>
                <p>
                  Orders are carefully checked, packed and handed over to
                  our delivery partner before shipment.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">02</span>
              <div>
                <h2>Shipping Across India</h2>
                <p>
                  We currently provide shipping services across India.
                  Delivery availability may depend on the location entered
                  during checkout.
                </p>
                <p>
                  Delivery timelines can vary depending on your location,
                  courier availability and other operational conditions.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">03</span>
              <div>
                <h2>Tracking Your Order</h2>
                <p>
                  Once your order has been dispatched, shipment and tracking
                  information may be provided through the contact details
                  associated with your order.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">04</span>
              <div>
                <h2>Delivery Address</h2>
                <p>
                  Please make sure that your name, phone number and complete
                  delivery address are correct before placing your order.
                </p>
                <p>
                  Incorrect or incomplete address information can result in
                  delivery delays or failed delivery attempts.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">05</span>
              <div>
                <h2>Cash on Delivery</h2>
                <p>
                  Cash on Delivery is available for eligible orders and
                  locations. Availability is shown during checkout.
                </p>
              </div>
            </article>

            <article className="policy-section">
              <span className="policy-number">06</span>
              <div>
                <h2>Need Help?</h2>
                <p>
                  If you have questions regarding an existing order or
                  delivery, please contact our team.
                </p>

                <a
                  href="https://wa.me/916393973678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="policy-button"
                >
                  CHAT ON WHATSAPP →
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="policy-bottom">
          <span>KASHI BANARAS</span>

          <h2>
            Crafted in Banaras.
            <br />
            <em>Delivered to you.</em>
          </h2>

          <Link href="/sarees" className="gold-btn">
            EXPLORE SAREES
          </Link>
        </section>
      </main>
    </>
  );
}