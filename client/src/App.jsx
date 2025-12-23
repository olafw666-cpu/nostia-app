import { useEffect, useState } from "react";
import {
  Home,
  Users,
  Calendar,
  Wallet,
  Compass,
  Plus,
  Search,
  Bell,
  Menu
} from "lucide-react";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [backendStatus, setBackendStatus] = useState("Connecting…");

  // 🔌 Backend connectivity check
  useEffect(() => {
    fetch("http://localhost:3000/")
      .then(res => res.text())
      .then(data => setBackendStatus(data))
      .catch(() => setBackendStatus("Backend unavailable"));
  }, []);

  const [user, setUser] = useState({
    id: "1",
    name: "Alex Rivera",
    username: "alex_explorer",
    homeOpen: false,
    friends: ["user2", "user3"]
  });

  const [trips, setTrips] = useState([
    {
      id: "1",
      name: "Colorado Rockies",
      destination: "Denver, CO",
      dateRange: "Jun 15–22",
      participants: 3,
      vaultBalance: 850
    },
    {
      id: "2",
      name: "Beach Getaway",
      destination: "Santa Cruz, CA",
      dateRange: "Jul 10–14",
      participants: 5,
      vaultBalance: 1200
    }
  ]);

  const toggleHomeStatus = () => {
    setUser(prev => ({ ...prev, homeOpen: !prev.homeOpen }));
  };

  const createTrip = () => {
    setTrips(prev => [
      ...prev,
      {
        id: String(prev.length + 1),
        name: "New Adventure",
        destination: "TBD",
        dateRange: "Select dates",
        participants: 1,
        vaultBalance: 0
      }
    ]);
  };

  /* ---------- Views ---------- */

  const HomeView = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">
          Welcome back, {user.name}!
        </h2>
        <p className="text-sm opacity-90">{backendStatus}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Home Status</h3>
          <button
            onClick={toggleHomeStatus}
            className={`px-4 py-2 rounded-full text-sm ${
              user.homeOpen
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {user.homeOpen ? "🏠 Open" : "🔒 Closed"}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {user.homeOpen
            ? "Friends can see you're available"
            : "Toggle to let friends know you're available"}
        </p>
      </div>
    </div>
  );

  const TripsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Trips</h2>
        <button
          onClick={createTrip}
          className="bg-blue-600 p-2 rounded-full hover:bg-blue-700"
        >
          <Plus size={20} />
        </button>
      </div>

      {trips.map(trip => (
        <div key={trip.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex justify-between">
            <div>
              <h3 className="text-white font-medium">{trip.name}</h3>
              <p className="text-sm text-gray-400">{trip.destination}</p>
            </div>
            <span className="text-xs text-blue-300">{trip.dateRange}</span>
          </div>

          <div className="flex justify-between mt-3 text-sm">
            <span className="text-gray-400 flex items-center gap-1">
              <Users size={16} /> {trip.participants}
            </span>
            <span className="text-green-400 flex items-center gap-1">
              <Wallet size={16} /> ${trip.vaultBalance}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const DiscoverView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Discover</h2>
      <div className="bg-gradient-to-r from-orange-600 to-pink-600 p-6 rounded-lg text-white">
        <Compass size={28} />
        <h3 className="font-semibold mt-2">Find Adventurers</h3>
        <p className="text-sm opacity-90 mt-1">
          Meet people nearby who want to explore
        </p>
      </div>
    </div>
  );

  const renderView = () => {
    if (currentView === "trips") return <TripsView />;
    if (currentView === "discover") return <DiscoverView />;
    return <HomeView />;
  };

  /* ---------- Layout ---------- */

  return (
    <div className="max-w-md mx-auto min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950 border-b border-gray-800 z-10">
        <div className="flex justify-between p-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Nostia
          </h1>
          <div className="flex gap-3">
            <Search size={18} />
            <Bell size={18} />
            <Menu size={18} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">{renderView()}</div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-950 border-t border-gray-800">
        <div className="flex justify-around p-2 text-xs">
          <button onClick={() => setCurrentView("home")} className={currentView === "home" ? "text-blue-400" : "text-gray-500"}>
            <Home size={20} />
            Home
          </button>
          <button onClick={() => setCurrentView("trips")} className={currentView === "trips" ? "text-blue-400" : "text-gray-500"}>
            <Calendar size={20} />
            Trips
          </button>
          <button onClick={() => setCurrentView("discover")} className={currentView === "discover" ? "text-blue-400" : "text-gray-500"}>
            <Compass size={20} />
            Discover
          </button>
          <button className="text-gray-500">
            <Users size={20} />
            Friends
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
