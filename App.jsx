import React, { useState } from 'react';
import { Home, Users, Calendar, MapPin, Wallet, Compass, Plus, Search, Bell, Menu } from 'lucide-react';

const NostiaApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState({
    id: '1',
    name: 'Alex Rivera',
    username: 'alex_explorer',
    homeOpen: false,
    friends: ['user2', 'user3']
  });

  const [trips, setTrips] = useState([
    { id: '1', name: 'Colorado Rockies', destination: 'Denver, CO', dateRange: 'Jun 15-22', participants: 3, vaultBalance: 850 },
    { id: '2', name: 'Beach Getaway', destination: 'Santa Cruz, CA', dateRange: 'Jul 10-14', participants: 5, vaultBalance: 1200 }
  ]);

  const [events, setEvents] = useState([
    { id: '1', title: 'Sunset Hike', host: 'Sarah M.', location: 'Horsetooth Rock', time: 'Today 6:00 PM', distance: '2.3 mi' },
    { id: '2', title: 'Coffee Meetup', host: 'Mike T.', location: 'Downtown FC', time: 'Tomorrow 10:00 AM', distance: '0.8 mi' }
  ]);

  const [adventurePosts, setAdventurePosts] = useState([
    { id: '1', author: 'Emma W.', location: 'Rocky Mountain NP', caption: 'Best trail of the year!', time: '2h ago', likes: 24 },
    { id: '2', author: 'Josh K.', location: 'Poudre Canyon', caption: 'Epic kayaking session', time: '5h ago', likes: 18 }
  ]);

  const toggleHomeStatus = () => {
    setUser(prev => ({ ...prev, homeOpen: !prev.homeOpen }));
  };

  const createTrip = () => {
    const newTrip = {
      id: String(trips.length + 1),
      name: 'New Adventure',
      destination: 'TBD',
      dateRange: 'Select dates',
      participants: 1,
      vaultBalance: 0
    };
    setTrips([...trips, newTrip]);
  };

  const HomeView = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
        <p className="opacity-90">Your next adventure awaits</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-white">Home Status</h3>
          <button
            onClick={toggleHomeStatus}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              user.homeOpen 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {user.homeOpen ? '🏠 Open' : '🔒 Closed'}
          </button>
        </div>
        <p className="text-sm text-gray-400">
          {user.homeOpen 
            ? 'Friends can see you\'re available to host' 
            : 'Toggle to let friends know your home is open'}
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-lg mb-3 text-white">Upcoming Trips</h3>
        {trips.slice(0, 2).map(trip => (
          <div key={trip.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
            <div>
              <div className="font-medium text-white">{trip.name}</div>
              <div className="text-sm text-gray-400">{trip.dateRange}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">{trip.participants} people</div>
              <div className="text-sm font-medium text-green-400">${trip.vaultBalance}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-lg mb-3 text-white">Nearby Events</h3>
        {events.map(event => (
          <div key={event.id} className="py-3 border-b border-gray-800 last:border-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-white">{event.title}</div>
                <div className="text-sm text-gray-400">by {event.host}</div>
                <div className="text-sm text-gray-500 mt-1">📍 {event.location} • {event.distance}</div>
              </div>
              <div className="text-xs text-gray-500">{event.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TripsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Trips</h2>
        <button
          onClick={createTrip}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {trips.map(trip => (
        <div key={trip.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-white">{trip.name}</h3>
              <p className="text-gray-400">{trip.destination}</p>
            </div>
            <span className="text-sm bg-blue-900 text-blue-300 px-3 py-1 rounded-full border border-blue-800">
              {trip.dateRange}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users size={18} className="text-gray-500" />
                <span className="text-sm text-gray-300">{trip.participants}</span>
              </div>
              <div className="flex items-center gap-1">
                <Wallet size={18} className="text-green-500" />
                <span className="text-sm font-medium text-green-400">${trip.vaultBalance}</span>
              </div>
            </div>
            <button className="text-blue-400 text-sm font-medium hover:underline">
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const DiscoverView = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Discover</h2>
      
      <div className="bg-gradient-to-r from-orange-600 to-pink-600 rounded-lg p-6 text-white">
        <Compass size={32} className="mb-2" />
        <h3 className="text-xl font-semibold mb-2">Find Adventurers</h3>
        <p className="text-sm opacity-90 mb-4">Connect with people nearby looking for adventure</p>
        <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Start Matching
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-lg mb-3 text-white">Adventure Feed</h3>
        {adventurePosts.map(post => (
          <div key={post.id} className="py-3 border-b border-gray-800 last:border-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-white">{post.author}</div>
                <div className="text-sm text-gray-300 mb-1">{post.caption}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>📍 {post.location}</span>
                  <span>❤️ {post.likes}</span>
                  <span>{post.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView />;
      case 'trips': return <TripsView />;
      case 'discover': return <DiscoverView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-black min-h-screen">
      <div className="bg-gray-950 border-b border-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Nostia
          </h1>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
              <Search size={20} className="text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
              <Bell size={20} className="text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
              <Menu size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {renderView()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-950 border-t border-gray-800">
        <div className="flex items-center justify-around p-2">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'home' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Home size={24} />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => setCurrentView('trips')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'trips' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Calendar size={24} />
            <span className="text-xs">Trips</span>
          </button>
          <button
            onClick={() => setCurrentView('discover')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'discover' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Compass size={24} />
            <span className="text-xs">Discover</span>
          </button>
          <button
            onClick={() => setCurrentView('friends')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'friends' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Users size={24} />
            <span className="text-xs">Friends</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NostiaApp;
