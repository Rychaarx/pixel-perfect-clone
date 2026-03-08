import Navbar from "@/components/Navbar";

const Feedback = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 px-4 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Feedback</h1>
      <p className="text-muted-foreground">Em breve você poderá enviar feedback.</p>
    </div>
  </div>
);

export default Feedback;
