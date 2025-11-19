import SquadSystem from "@/components/SquadSystem";
import BottomNav from "@/components/layout/BottomNav";

const SquadsPage = () => {
    return (
        <div className="min-h-screen bg-background pb-24 p-4 md:p-8">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow mb-2">
                    SQUADRON <span className="text-primary">COMMAND</span>
                </h1>
                <p className="text-white/60 font-light">Manage your elite focus unit.</p>
            </header>

            <div className="max-w-md mx-auto">
                <SquadSystem isFocusing={false} />
            </div>
            <BottomNav />
        </div>
    );
};

export default SquadsPage;
