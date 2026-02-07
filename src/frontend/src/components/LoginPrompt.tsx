export default function LoginPrompt() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-lg overflow-hidden mb-8">
          <img
            src="/assets/generated/pepper-farm-hero.dim_800x400.jpg"
            alt="Pepper Farm"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to Pepper Farm Bookkeeping</h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive financial management for your pepper farm
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <img src="/assets/generated/income-icon-transparent.dim_64x64.png" alt="Income" className="w-12 h-12" />
              <h3 className="text-xl font-semibold">Income & Expense Tracking</h3>
            </div>
            <p className="text-muted-foreground">
              Record and categorize all your farm income and expenses with detailed descriptions and date tracking.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/generated/inventory-icon-transparent.dim_64x64.png"
                alt="Inventory"
                className="w-12 h-12"
              />
              <h3 className="text-xl font-semibold">Inventory Management</h3>
            </div>
            <p className="text-muted-foreground">
              Track peppers, fertilizers, pesticides, and equipment with real-time quantity and value monitoring.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/generated/customer-icon-transparent.dim_64x64.png"
                alt="Customers"
                className="w-12 h-12"
              />
              <h3 className="text-xl font-semibold">Customer Management</h3>
            </div>
            <p className="text-muted-foreground">
              Maintain customer records and view complete purchase history for better relationship management.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/generated/dashboard-icon-transparent.dim_64x64.png"
                alt="Dashboard"
                className="w-12 h-12"
              />
              <h3 className="text-xl font-semibold">Financial Dashboard</h3>
            </div>
            <p className="text-muted-foreground">
              View comprehensive financial summaries including profit/loss, inventory value, and recent transactions.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Please login to access your farm bookkeeping system</p>
          <p className="text-sm text-muted-foreground">Click the Login button in the header to get started</p>
        </div>
      </div>
    </div>
  );
}
