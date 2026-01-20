import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Home,
  Users,
  Calendar,
  Wallet,
  Compass,
  Plus,
  Search,
  Bell,
  Menu,
  LogOut,
  X,
  UserPlus,
  Check,
  Trash2,
  Loader,
  Bot,
  Sparkles,
  Wand2
} from "lucide-react";
import {
  authAPI,
  friendsAPI,
  tripsAPI,
  eventsAPI,
  adventuresAPI,
  feedAPI,
  vaultAPI,
  aiAPI,
  getToken,
  getCurrentUser,
} from "./api";
import ToastProvider from "./components/Toast";
import Button from "./components/Button";
import { SkeletonCard } from "./components/SkeletonLoader";
import EmptyState from "./components/EmptyState";
import PaymentModal from "./components/PaymentModal";
import AIChatModal from "./components/AIChatModal";
import { buttonPress, slideIn, fadeIn } from "./utils/animations";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'

  // Data states
  const [trips, setTrips] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ received: [], sent: [] });
  const [events, setEvents] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [feed, setFeed] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [vaultData, setVaultData] = useState(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTripDetailsModal, setShowTripDetailsModal] = useState(false);
  const [tripInvitations, setTripInvitations] = useState([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState([]);
  const [customSplits, setCustomSplits] = useState({});
  const [splitMode, setSplitMode] = useState('equal'); // 'equal', 'percentage', 'custom'
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiTripContext, setAITripContext] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
    const savedUser = getCurrentUser();
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(savedUser);
      loadData();
    } else {
      setShowAuthModal(true);
    }
  }, []);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsData, friendsData, requestsData, eventsData, adventuresData, feedData, invitationsData] = await Promise.all([
        tripsAPI.getAll(),
        friendsAPI.getAll(),
        friendsAPI.getRequests(),
        eventsAPI.getUpcoming(10),
        adventuresAPI.getAll(),
        feedAPI.getUserFeed(20),
        tripsAPI.getInvitations(),
      ]);

      setTrips(tripsData);
      setFriends(friendsData);
      setFriendRequests(requestsData);
      setEvents(eventsData);
      setAdventures(adventuresData);
      setFeed(feedData);
      setTripInvitations(invitationsData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Authentication handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.login(username, password);
      setUser(data.user);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      toast.success(`Welcome back, ${data.user.name}!`);
      await loadData();
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const name = formData.get('name');
    const email = formData.get('email');

    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.register(username, password, name, email);
      setUser(data.user);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      toast.success(`Account created! Welcome, ${data.user.name}!`);
      await loadData();
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setTrips([]);
    setFriends([]);
    setEvents([]);
    setShowAuthModal(true);
    toast.success('Logged out successfully');
  };

  const toggleHomeStatus = async () => {
    try {
      const newStatus = user.homeStatus === 'open' ? 'closed' : 'open';
      const updatedUser = await authAPI.updateMe({ homeStatus: newStatus });
      setUser(updatedUser);
      toast.success(`Home status set to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      setLoading(true);
      const tripData = {
        title: formData.get('title'),
        description: formData.get('description'),
        destination: formData.get('destination'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
      };

      const newTrip = await tripsAPI.create(tripData);
      setTrips([...trips, newTrip]);
      setShowCreateTripModal(false);
      e.target.reset();
      toast.success('Trip created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      setLoading(true);
      const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        location: formData.get('location'),
        eventDate: formData.get('eventDate'),
        type: formData.get('type'),
      };

      const newEvent = await eventsAPI.create(eventData);
      setEvents([...events, newEvent]);
      setShowCreateEventModal(false);
      e.target.reset();
      toast.success('Event created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      toast.success('Friend request accepted!');
      await loadData(); // Reload friends and requests
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      await friendsAPI.rejectRequest(requestId);
      toast.success('Friend request rejected');
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenVault = async (trip) => {
    try {
      setSelectedTrip(trip);
      setVaultData(null); // Reset vault data
      setShowVaultModal(true); // Show modal immediately with loading state

      const data = await vaultAPI.getTripSummary(trip.id);
      setVaultData(data);
    } catch (err) {
      console.error('Vault loading error:', err);
      toast.error(err.message || 'Failed to load vault data');
      setShowVaultModal(false); // Close modal on error
    }
  };

  const handleSearchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await friendsAPI.searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSendFriendRequest = async (userId, username) => {
    try {
      await friendsAPI.sendRequest(userId);
      toast.success(`Friend request sent to @${username}!`);
      setSearchResults([]);
      setFriendSearchQuery('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateVaultEntry = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      setLoading(true);
      const amount = parseFloat(formData.get('amount'));

      console.log('Creating vault entry:', {
        user,
        selectedTrip,
        participants: selectedTrip.participants,
        splitMode,
        customSplits
      });

      if (!user || !user.id) {
        throw new Error('User not logged in');
      }

      const participants = selectedTrip.participants || [{ id: user.id }];

      if (participants.length === 0) {
        throw new Error('No participants in this trip');
      }

      let splits;

      if (splitMode === 'equal' || Object.keys(customSplits).length === 0) {
        // Equal split
        splits = participants.map(p => ({
          userId: p.id,
          amount: amount / participants.length,
          percentage: 100 / participants.length,
        }));
      } else if (splitMode === 'percentage') {
        // Percentage split
        const totalPercentage = Object.values(customSplits).reduce((a, b) => a + b, 0);
        if (Math.abs(totalPercentage - 100) >= 0.01) {
          throw new Error('Percentages must add up to 100%');
        }
        splits = participants.map(p => ({
          userId: p.id,
          percentage: customSplits[p.id] || 0,
          amount: (amount * (customSplits[p.id] || 0)) / 100,
        }));
      } else {
        // Custom amount split
        splits = participants.map(p => ({
          userId: p.id,
          amount: customSplits[p.id] || 0,
          percentage: ((customSplits[p.id] || 0) / amount) * 100,
        }));
      }

      const entryData = {
        tripId: selectedTrip.id,
        description: formData.get('description'),
        amount: amount,
        currency: formData.get('currency') || 'USD',
        category: formData.get('category'),
        paidBy: user.id,
        splits: splits,
      };

      console.log('Entry data being sent:', entryData);

      await vaultAPI.createEntry(entryData);
      toast.success('Expense added!');

      // Reload vault data
      const data = await vaultAPI.getTripSummary(selectedTrip.id);
      setVaultData(data);
      setShowAddExpenseForm(false);
      setSplitMode('equal');
      setCustomSplits({});
      e.target.reset();
    } catch (err) {
      console.error('Error creating vault entry:', err);
      toast.error(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handlePaySplit = (split) => {
    setSelectedSplit(split);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    toast.success('Payment completed!');
    setShowPaymentModal(false);
    setSelectedSplit(null);

    // Reload vault data
    const data = await vaultAPI.getTripSummary(selectedTrip.id);
    setVaultData(data);
  };

  // Trip invitation handlers
  const handleInviteToTrip = async (userId) => {
    try {
      await tripsAPI.inviteUser(selectedTrip.id, userId);
      toast.success('Invitation sent!');
      setInviteSearchQuery('');
      setInviteSearchResults([]);
      // Reload trip data
      const updatedTrip = await tripsAPI.getById(selectedTrip.id);
      setSelectedTrip(updatedTrip);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRespondToInvitation = async (invitationId, accept) => {
    try {
      await tripsAPI.respondToInvitation(invitationId, accept);
      toast.success(accept ? 'Invitation accepted!' : 'Invitation declined');
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSearchUsersForInvite = async (query) => {
    if (!query || query.length < 2) {
      setInviteSearchResults([]);
      return;
    }
    try {
      const results = await friendsAPI.searchUsers(query);
      // Filter out existing participants and pending invitations
      const participantIds = selectedTrip?.participants?.map(p => p.id) || [];
      const invitedIds = selectedTrip?.invitations?.map(i => i.invitedUserId) || [];
      const filtered = results.filter(u =>
        !participantIds.includes(u.id) && !invitedIds.includes(u.id)
      );
      setInviteSearchResults(filtered);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTransferVaultLeader = async (newLeaderId) => {
    try {
      const updatedTrip = await tripsAPI.transferVaultLeader(selectedTrip.id, newLeaderId);
      setSelectedTrip(updatedTrip);
      toast.success('Vault leader transferred!');
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenTripDetails = async (trip) => {
    try {
      const fullTrip = await tripsAPI.getById(trip.id);
      setSelectedTrip(fullTrip);
      setShowTripDetailsModal(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ---------- Views ---------- */

  const HomeView = () => (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white shadow-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-1">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-sm opacity-90">@{user?.username}</p>
      </motion.div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Home Status</h3>
          <motion.button
            onClick={toggleHomeStatus}
            variants={buttonPress}
            whileHover="hover"
            whileTap="pressed"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              user?.homeStatus === 'open'
                ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-500/30"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            <motion.span
              animate={{
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {user?.homeStatus === 'open' ? "🏠 Open" : "🔒 Closed"}
            </motion.span>
          </motion.button>
        </div>
        <p className="text-xs text-gray-400">
          {user?.homeStatus === 'open'
            ? "Friends can see you're available"
            : "Toggle to let friends know you're available"}
        </p>
      </div>

      {/* Upcoming Events */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-white mb-3">Upcoming Events</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="bg-gray-800 p-3 rounded">
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="text-xs text-gray-400">{event.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feed Preview */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-white mb-3">Recent Activity</h3>
        {feed.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {feed.slice(0, 3).map(post => (
              <div key={post.id} className="bg-gray-800 p-3 rounded">
                <p className="text-xs text-gray-400 mb-1">@{post.username}</p>
                <p className="text-sm text-white">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const TripsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Trips</h2>
        <button
          onClick={() => setShowCreateTripModal(true)}
          className="bg-blue-600 p-2 rounded-full hover:bg-blue-700"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Trip Invitations */}
      {tripInvitations.length > 0 && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-300 mb-3">Trip Invitations</h3>
          <div className="space-y-2">
            {tripInvitations.map(inv => (
              <div key={inv.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">{inv.tripTitle}</p>
                  <p className="text-xs text-gray-400">From @{inv.invitedByUsername}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondToInvitation(inv.id, true)}
                    className="bg-green-600 px-3 py-1 rounded text-xs hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToInvitation(inv.id, false)}
                    className="bg-red-600 px-3 py-1 rounded text-xs hover:bg-red-700"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center">
          <p className="text-gray-400">No trips yet. Create your first adventure!</p>
        </div>
      ) : (
        trips.map(trip => (
          <div key={trip.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <div
              className="cursor-pointer"
              onClick={() => handleOpenTripDetails(trip)}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="text-white font-medium">{trip.title}</h3>
                  <p className="text-sm text-gray-400">{trip.destination}</p>
                </div>
                <span className="text-xs text-blue-300">
                  {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'}
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Users size={16} /> {trip.participants?.length || 0}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAITripContext(trip);
                    setShowAIChat(true);
                  }}
                  className="text-purple-400 flex items-center gap-1 hover:text-purple-300"
                >
                  <Wand2 size={16} /> AI Plan
                </button>
                <button
                  onClick={() => handleOpenTripDetails(trip)}
                  className="text-blue-400 flex items-center gap-1 hover:text-blue-300"
                >
                  <UserPlus size={16} /> Invite
                </button>
                <button
                  onClick={() => handleOpenVault(trip)}
                  className="text-green-400 flex items-center gap-1 hover:text-green-300"
                >
                  <Wallet size={16} /> Vault
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const DiscoverView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Discover</h2>
        <button
          onClick={() => setShowCreateEventModal(true)}
          className="bg-purple-600 p-2 rounded-full hover:bg-purple-700"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Events Section */}
      {events.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Upcoming Events</h3>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-lg border border-purple-700">
                <h4 className="text-white font-medium">{event.title}</h4>
                <p className="text-sm text-purple-200 mt-1">{event.description}</p>
                <div className="flex justify-between items-center mt-3 text-sm">
                  <span className="text-purple-300">📍 {event.location}</span>
                  <span className="text-purple-300">
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adventures Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Adventures</h3>
        {adventures.length === 0 ? (
          <div className="bg-gradient-to-r from-orange-600 to-pink-600 p-6 rounded-lg text-white">
            <Compass size={28} />
            <h3 className="font-semibold mt-2">Find Adventures</h3>
            <p className="text-sm opacity-90 mt-1">
              Discover exciting activities and locations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {adventures.map(adventure => (
              <div key={adventure.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                <h3 className="text-white font-medium">{adventure.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{adventure.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                    {adventure.category}
                  </span>
                  <span className="text-xs bg-orange-900 text-orange-300 px-2 py-1 rounded">
                    {adventure.difficulty}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">📍 {adventure.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const FriendsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Friends</h2>
        <button
          onClick={() => setShowAddFriendModal(true)}
          className="bg-blue-600 p-2 rounded-full hover:bg-blue-700"
        >
          <UserPlus size={20} />
        </button>
      </div>

      {/* Friend Requests */}
      {friendRequests.received.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 className="font-semibold text-white mb-3">Friend Requests</h3>
          <div className="space-y-2">
            {friendRequests.received.map(request => (
              <div key={request.id} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                <div>
                  <p className="text-sm font-medium text-white">{request.name}</p>
                  <p className="text-xs text-gray-400">@{request.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptFriendRequest(request.id)}
                    className="bg-green-600 p-2 rounded hover:bg-green-700"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleRejectFriendRequest(request.id)}
                    className="bg-red-600 p-2 rounded hover:bg-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-white mb-3">
          My Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-400">No friends yet. Start connecting!</p>
        ) : (
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                <div>
                  <p className="text-sm font-medium text-white">{friend.name}</p>
                  <p className="text-xs text-gray-400">@{friend.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    friend.homeStatus === 'open' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderView = () => {
    if (currentView === "trips") return <TripsView />;
    if (currentView === "discover") return <DiscoverView />;
    if (currentView === "friends") return <FriendsView />;
    return <HomeView />;
  };

  /* ---------- Modals ---------- */

  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">
          {authMode === 'login' ? 'Login to Nostia' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
          {authMode === 'register' && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              className="w-full bg-gray-800 text-white p-3 rounded mb-3"
            />
          )}
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          {authMode === 'register' && (
            <input
              type="email"
              name="email"
              placeholder="Email (optional)"
              className="w-full bg-gray-800 text-white p-3 rounded mb-3"
            />
          )}
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full bg-gray-800 text-white p-3 rounded mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}
          </button>
        </form>

        <button
          onClick={() => {
            setAuthMode(authMode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          className="w-full mt-3 text-blue-400 text-sm hover:underline"
        >
          {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </div>
    </div>
  );

  const CreateTripModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Create New Trip</h2>
          <button onClick={() => setShowCreateTripModal(false)}>
            <X className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleCreateTrip}>
          <input
            type="text"
            name="title"
            placeholder="Trip Title"
            required
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          <input
            type="text"
            name="destination"
            placeholder="Destination"
            required
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          <textarea
            name="description"
            placeholder="Description"
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
            rows="3"
          />
          <input
            type="date"
            name="startDate"
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          <input
            type="date"
            name="endDate"
            className="w-full bg-gray-800 text-white p-3 rounded mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );

  const CreateEventModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Create Event</h2>
          <button onClick={() => setShowCreateEventModal(false)}>
            <X className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleCreateEvent}>
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            required
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          <textarea
            name="description"
            placeholder="Description"
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
            rows="3"
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            required
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          <input
            type="date"
            name="eventDate"
            className="w-full bg-gray-800 text-white p-3 rounded mb-3"
          />
          <select
            name="type"
            className="w-full bg-gray-800 text-white p-3 rounded mb-4"
          >
            <option value="social">Social</option>
            <option value="adventure">Adventure</option>
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );

  const AddFriendModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Add Friend</h2>
          <button onClick={() => {
            setShowAddFriendModal(false);
            setSearchResults([]);
            setFriendSearchQuery('');
          }}>
            <X className="text-gray-400" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by username..."
          value={friendSearchQuery}
          onChange={(e) => {
            setFriendSearchQuery(e.target.value);
            handleSearchUsers(e.target.value);
          }}
          className="w-full bg-gray-800 text-white p-3 rounded mb-3"
        />

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleSendFriendRequest(user.id, user.username)}
                  className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {friendSearchQuery.length >= 2 && searchResults.length === 0 && (
          <p className="text-sm text-gray-400 text-center">No users found</p>
        )}
      </div>
    </div>
  );

  const VaultModal = () => {
    if (!selectedTrip) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              {selectedTrip.title} - Vault
            </h2>
            <button
              onClick={() => {
                setShowVaultModal(false);
                setVaultData(null);
                setShowAddExpenseForm(false);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {!vaultData ? (
            <div className="text-center py-8">
              <Loader className="animate-spin mx-auto mb-2" size={32} />
              <p className="text-gray-400">Loading vault data...</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Summary */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg text-white">
              <h3 className="font-semibold mb-2">Trip Summary</h3>
              <p className="text-2xl font-bold">
                ${vaultData.totalExpenses?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm opacity-90">Total Expenses</p>
            </div>

            {/* Add Expense Button */}
            <button
              onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              {showAddExpenseForm ? 'Cancel' : '+ Add Expense'}
            </button>

            {/* Add Expense Form */}
            {showAddExpenseForm && (
              <form onSubmit={handleCreateVaultEntry} className="bg-gray-800 p-4 rounded-lg space-y-3">
                <input
                  type="text"
                  name="description"
                  placeholder="Expense description"
                  required
                  className="w-full bg-gray-700 text-white p-2 rounded"
                />
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  onChange={(e) => {
                    // Reset custom splits when amount changes
                    if (splitMode !== 'equal') {
                      const amount = parseFloat(e.target.value) || 0;
                      const participants = selectedTrip?.participants || [];
                      const newSplits = {};
                      participants.forEach(p => {
                        newSplits[p.id] = splitMode === 'percentage' ? 100 / participants.length : amount / participants.length;
                      });
                      setCustomSplits(newSplits);
                    }
                  }}
                />
                <select
                  name="category"
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  required
                >
                  <option value="">Select category</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="activities">Activities</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="hidden"
                  name="currency"
                  value="USD"
                />

                {/* Split Mode Selection - Only visible to vault leader */}
                {selectedTrip?.vaultLeaderId === user?.id && (
                  <div className="border border-gray-600 rounded p-3">
                    <p className="text-xs text-blue-300 mb-2">Split Mode (Vault Leader Only)</p>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSplitMode('equal');
                          setCustomSplits({});
                        }}
                        className={`flex-1 py-1 rounded text-xs ${
                          splitMode === 'equal' ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        Equal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSplitMode('percentage');
                          const participants = selectedTrip?.participants || [];
                          const newSplits = {};
                          participants.forEach(p => {
                            newSplits[p.id] = 100 / participants.length;
                          });
                          setCustomSplits(newSplits);
                        }}
                        className={`flex-1 py-1 rounded text-xs ${
                          splitMode === 'percentage' ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        By %
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSplitMode('custom');
                          const participants = selectedTrip?.participants || [];
                          const newSplits = {};
                          participants.forEach(p => {
                            newSplits[p.id] = 0;
                          });
                          setCustomSplits(newSplits);
                        }}
                        className={`flex-1 py-1 rounded text-xs ${
                          splitMode === 'custom' ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        Custom $
                      </button>
                    </div>

                    {/* Custom split inputs */}
                    {splitMode !== 'equal' && (
                      <div className="space-y-2">
                        {selectedTrip?.participants?.map(p => (
                          <div key={p.id} className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">{p.name || p.username}</span>
                            <div className="flex items-center gap-1">
                              {splitMode === 'percentage' && <span className="text-xs text-gray-500">%</span>}
                              {splitMode === 'custom' && <span className="text-xs text-gray-500">$</span>}
                              <input
                                type="number"
                                step={splitMode === 'percentage' ? '1' : '0.01'}
                                min="0"
                                value={customSplits[p.id] || 0}
                                onChange={(e) => {
                                  setCustomSplits({
                                    ...customSplits,
                                    [p.id]: parseFloat(e.target.value) || 0
                                  });
                                }}
                                className="w-20 bg-gray-600 text-white p-1 rounded text-xs text-right"
                              />
                            </div>
                          </div>
                        ))}
                        {splitMode === 'percentage' && (
                          <p className={`text-xs ${
                            Math.abs(Object.values(customSplits).reduce((a, b) => a + b, 0) - 100) < 0.01
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}>
                            Total: {Object.values(customSplits).reduce((a, b) => a + b, 0).toFixed(1)}%
                            {Math.abs(Object.values(customSplits).reduce((a, b) => a + b, 0) - 100) >= 0.01 && ' (must equal 100%)'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  {splitMode === 'equal'
                    ? `Will be split equally among ${selectedTrip?.participants?.length || 1} participant(s)`
                    : splitMode === 'percentage'
                    ? 'Split by percentage'
                    : 'Custom amount per person'}
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
              </form>
            )}

            {/* Expenses List */}
            <div>
              <h3 className="font-semibold text-white mb-3">Expenses</h3>
              {vaultData.entries && vaultData.entries.length > 0 ? (
                <div className="space-y-2">
                  {vaultData.entries.map(entry => (
                    <div key={entry.id} className="bg-gray-800 p-3 rounded">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-white">{entry.description}</p>
                        <p className="text-sm font-bold text-green-400">
                          ${entry.amount?.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">{entry.category}</p>
                      <p className="text-xs text-gray-500">
                        Paid by {entry.paidByName} • {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No expenses yet</p>
              )}
            </div>

            {/* Your Unpaid Splits */}
            {vaultData.unpaidSplits && vaultData.unpaidSplits.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Your Unpaid Expenses</h3>
                <div className="space-y-2">
                  {vaultData.unpaidSplits.map(split => (
                    <div key={split.id} className="bg-red-900/20 border border-red-700 p-3 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{split.description}</p>
                          <p className="text-xs text-gray-400">Pay to: {split.paidByName}</p>
                        </div>
                        <p className="text-sm font-bold text-red-400">
                          ${split.amount?.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePaySplit(split)}
                        className="w-full bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700"
                      >
                        💳 Pay with Stripe
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Balances */}
            {vaultData.balances && Object.keys(vaultData.balances).length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Balances</h3>
                <div className="space-y-2">
                  {Object.entries(vaultData.balances).map(([userId, balanceData]) => (
                    <div key={userId} className="flex justify-between bg-gray-800 p-2 rounded">
                      <span className="text-sm text-white">{balanceData.name || balanceData.username}</span>
                      <span className={`text-sm font-medium ${
                        balanceData.balance > 0 ? 'text-green-400' : balanceData.balance < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {balanceData.balance > 0 ? '+' : ''}${balanceData.balance?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TripDetailsModal = () => {
    if (!selectedTrip) return null;

    const isVaultLeader = selectedTrip.vaultLeaderId === user?.id;
    const isCreator = selectedTrip.createdBy === user?.id;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full my-8 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{selectedTrip.title}</h2>
            <button
              onClick={() => {
                setShowTripDetailsModal(false);
                setSelectedTrip(null);
                setInviteSearchQuery('');
                setInviteSearchResults([]);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Trip Info */}
          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-400">{selectedTrip.destination}</p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : 'TBD'} -
              {selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : 'TBD'}
            </p>
            {selectedTrip.description && (
              <p className="text-sm text-gray-300 mt-2">{selectedTrip.description}</p>
            )}
          </div>

          {/* Vault Leader Info */}
          <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg mb-4">
            <p className="text-xs text-blue-300">Vault Leader</p>
            <p className="text-sm text-white font-medium">
              {selectedTrip.vaultLeaderName || selectedTrip.vaultLeaderUsername || 'Not assigned'}
              {isVaultLeader && ' (You)'}
            </p>
          </div>

          {/* Participants */}
          <div className="mb-4">
            <h3 className="font-semibold text-white mb-3">
              Participants ({selectedTrip.participants?.length || 0})
            </h3>
            <div className="space-y-2">
              {selectedTrip.participants?.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                  <div>
                    <p className="text-sm text-white">{p.name}</p>
                    <p className="text-xs text-gray-400">@{p.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.id === selectedTrip.vaultLeaderId && (
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">Leader</span>
                    )}
                    {p.role === 'creator' && (
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded">Creator</span>
                    )}
                    {isVaultLeader && p.id !== user?.id && (
                      <button
                        onClick={() => handleTransferVaultLeader(p.id)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Make Leader
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          {selectedTrip.invitations?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-white mb-3">Pending Invitations</h3>
              <div className="space-y-2">
                {selectedTrip.invitations.map(inv => (
                  <div key={inv.id} className="bg-yellow-900/30 border border-yellow-700 p-2 rounded">
                    <p className="text-sm text-white">{inv.name}</p>
                    <p className="text-xs text-gray-400">@{inv.username} - Pending</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Users */}
          <div className="mb-4">
            <h3 className="font-semibold text-white mb-3">Invite People</h3>

            {/* Friends Suggestions */}
            {friends.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Friends</p>
                <div className="flex flex-wrap gap-2">
                  {friends
                    .filter(f => !selectedTrip.participants?.some(p => p.id === f.id))
                    .filter(f => !selectedTrip.invitations?.some(i => i.invitedUserId === f.id))
                    .slice(0, 5)
                    .map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => handleInviteToTrip(friend.id)}
                        className="bg-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        @{friend.username}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Search for anyone */}
            <input
              type="text"
              placeholder="Search any user by username..."
              value={inviteSearchQuery}
              onChange={(e) => {
                setInviteSearchQuery(e.target.value);
                handleSearchUsersForInvite(e.target.value);
              }}
              className="w-full bg-gray-800 text-white p-2 rounded mb-2"
            />

            {inviteSearchResults.length > 0 && (
              <div className="space-y-2">
                {inviteSearchResults.map(u => (
                  <div key={u.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <div>
                      <p className="text-sm text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                    <button
                      onClick={() => handleInviteToTrip(u.id)}
                      className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowTripDetailsModal(false);
                handleOpenVault(selectedTrip);
              }}
              className="flex-1 bg-green-600 text-white p-3 rounded hover:bg-green-700"
            >
              Open Vault
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Layout ---------- */

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <>
      <ToastProvider />
      <div className="max-w-md mx-auto min-h-screen bg-black text-white">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 z-10">
          <div className="flex justify-between p-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Nostia
            </h1>
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Search size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Bell size={18} />
              </motion.button>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={18} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-24">
          {loading && trips.length === 0 ? <SkeletonCard count={4} /> : renderView()}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-950 border-t border-gray-800">
          <div className="flex justify-around p-2 text-xs">
            <motion.button
              onClick={() => setCurrentView("home")}
              className={currentView === "home" ? "text-blue-400" : "text-gray-500"}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={20} className="mx-auto" />
              Home
            </motion.button>
            <motion.button
              onClick={() => setCurrentView("trips")}
              className={currentView === "trips" ? "text-blue-400" : "text-gray-500"}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar size={20} className="mx-auto" />
              Trips
            </motion.button>
            <motion.button
              onClick={() => setCurrentView("discover")}
              className={currentView === "discover" ? "text-blue-400" : "text-gray-500"}
              whileTap={{ scale: 0.95 }}
            >
              <Compass size={20} className="mx-auto" />
              Discover
            </motion.button>
            <motion.button
              onClick={() => setCurrentView("friends")}
              className={currentView === "friends" ? "text-blue-400" : "text-gray-500"}
              whileTap={{ scale: 0.95 }}
            >
              <Users size={20} className="mx-auto" />
              Friends
            </motion.button>
          </div>
        </div>

        {/* Modals */}
        {showCreateTripModal && <CreateTripModal />}
        {showCreateEventModal && <CreateEventModal />}
        {showAddFriendModal && <AddFriendModal />}
        {showVaultModal && <VaultModal />}
        {showTripDetailsModal && <TripDetailsModal />}
        {showAuthModal && <AuthModal />}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedSplit(null);
          }}
          vaultSplitId={selectedSplit?.id}
          amount={selectedSplit?.amount || 0}
          recipientName={selectedSplit?.paidByName}
          tripTitle={selectedTrip?.title}
          onSuccess={handlePaymentSuccess}
        />

        {/* AI Chat Modal */}
        <AIChatModal
          isOpen={showAIChat}
          onClose={() => {
            setShowAIChat(false);
            setAITripContext(null);
          }}
          tripContext={aiTripContext}
          onGenerateItinerary={(itinerary) => {
            toast.success('Itinerary generated!');
            console.log('Generated itinerary:', itinerary);
          }}
        />

        {/* Floating AI Assistant Button */}
        {isAuthenticated && !showAIChat && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setAITripContext(null);
              setShowAIChat(true);
            }}
            className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center z-40 hover:shadow-purple-500/30 hover:shadow-xl transition-shadow"
          >
            <Bot size={24} className="text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
          </motion.button>
        )}
      </div>
    </>
  );
}

export default App;
