export default function Privacy() {
  return (
    <div className="min-h-screen bg-felt-dark text-white font-sans">
      <div className="fixed inset-0 bg-felt-texture opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 bg-smoky opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Privacy Policy</h1>
          
          <div className="bg-black/60 backdrop-blur-sm border border-neon-green/20 rounded-xl p-8 shadow-felt">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Information We Collect</h2>
                <p>
                  We collect account details, payment identifiers (via Stripe), and usage logs 
                  necessary to provide our billiards league management services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Payment Processing</h2>
                <p>
                  Stripe processes all payments. We never store full card numbers or sensitive payment information.
                  All payment data is handled securely by Stripe's PCI-compliant infrastructure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Data Usage</h2>
                <p>
                  Your information is used solely to provide tournament management services,
                  process payments, and maintain player standings and statistics.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Privacy Requests</h2>
                <p>
                  For privacy-related requests, data access, or deletion requests, 
                  please contact us at privacy@actionladder.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Data Security</h2>
                <p>
                  We implement appropriate security measures to protect your personal information
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}