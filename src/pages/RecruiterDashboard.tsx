import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BsBuilding, BsCurrencyDollar, BsPencil, BsBriefcase,  BsSearch,  BsFilter, BsList } from "react-icons/bs";
import { HiOutlineDocumentText, HiOutlineUsers } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { useLocation } from "react-router-dom";
import { getInitialTheme, toggleTheme as toggleThemeUtil } from '@/components/theme';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  where 
} from 'firebase/firestore';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Candidate {
  id: string;
  developerId: string;
  ideaId: string;
  name: string;
  experience: string;
  skills: string[];
  appliedDate: string;
  status: string;
  coverLetter: string;
  resume: string;
  email: string;
  github: string;
  university: string;
  degree: string;
  graduationYear: string;
  photoURL: string;
  whatsappNumber: string;
}

interface InvestorApplication {
  id: string;
  investorId: string;
  ideaId: string;
  name: string;
  email: string;
  portfolioValue: number;
  investmentHistory: string[];
  investmentInterests: string;
  netWorth: string;
  pastInvestments: string;
  appliedDate: string;
  status: string;
  coverLetter: string;
  photoURL: string;
  whatsappNumber: string;
}


interface RecruiterProfile {
  companyName: string;
  companyWebsite: string;
  companySize: string;
  fundingStage: string;
  equityRange: string;
  salaryRange: string;
  roleDescription: string;
  techStack: string;
  experienceRequired: string;
  uid: string;
  email: string;
  photoURL: string;
}

interface IdeaPost extends RecruiterProfile {
  cofounderRole: string;
  ideaDescription: string;
  responsibilities: string;
  idealCandidate: string;
}

export const RecruiterDashboard = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewing' | 'accepted' | 'rejected'>('pending');
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<RecruiterProfile | null>(null);
  const [isPostingIdea, setIsPostingIdea] = useState(false);
  const [ideaPost, setIdeaPost] = useState<IdeaPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  const [developerCandidates, setDeveloperCandidates] = useState<Candidate[]>([]);
  const [investorApplications, setInvestorApplications] = useState<InvestorApplication[]>([]);
  const [showInvestorApplicationDetails, setShowInvestorApplicationDetails] = useState(false);
  const [selectedInvestorApplication, setSelectedInvestorApplication] = useState<InvestorApplication | null>(null);
  const [activeApplicationTab, setActiveApplicationTab] = useState<'developers' | 'investors'>('developers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDeveloperCandidates, setFilteredDevelopers] = useState<Candidate[]>([]);
  const [filteredInvestorApplications, setFilteredInvestors] = useState<InvestorApplication[]>([]);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest'>('newest');
  const [experienceFilter, setExperienceFilter] = useState<'all' | '0-1' | '1-3' | '3-5' | '5+'>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme());
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  
  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const availableSkills = [
    'Python', 'Java', 'JavaScript', 'Kotlin', 'Swift', 'C', 'C++', 'C#', 
    'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Spring'
  ];

  const handleViewInvestorApplication = (application: InvestorApplication) => {
    setSelectedInvestorApplication(application);
    setShowInvestorApplicationDetails(true);
  };

  const toggleTheme = () => {
    const newTheme = toggleThemeUtil();
    setTheme(newTheme);
  };

  // Replace your useEffect with:
  useEffect(() => {
    // This effect runs once on component mount
    // Check the actual DOM state, which was set by the IIFE in theme.ts
    const isDarkMode = document.documentElement.classList.contains('dark');
    setTheme(isDarkMode ? 'dark' : 'light');
  }, []);

  

  const handleUpdateApplicationStatus = async (candidateId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      setIsSubmitting(true);
      const db = getFirestore();
      const applicationRef = doc(db, 'applications', candidateId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setDeveloperCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, status: newStatus }
          : candidate
      ));

      toast({
        title: "Success",
        description: `Application ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInvestorApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      setIsSubmitting(true);
      const db = getFirestore();
      const applicationRef = doc(db, 'investmentInterests', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setInvestorApplications(prev => prev.map(application => 
        application.id === applicationId 
          ? { ...application, status: newStatus }
          : application
      ));

      toast({
        title: "Success",
        description: `Application ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();
        const uid = location.state?.uid;

        if (!uid) {
          toast({
            title: "Error",
            description: "User ID not found. Please try logging in again.",
            variant: "destructive"
          });
          setLoading(false); // Important to set loading to false even on error
          return;
        }

        // Fetch recruiter profile
        const profileRef = doc(db, 'recruiters', uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as RecruiterProfile);
        }

        // Fetch developer applications for this recruiter's job posts
        const applicationsRef = collection(db, 'applications');
        const developerQuery = query(
          applicationsRef,
          where('recruiterId', '==', uid)
        );
        const developerApplicationsSnap = await getDocs(developerQuery);
        
        // Fetch developer details for each application
        const developerCandidatesData = await Promise.all(
          developerApplicationsSnap.docs.map(async (appDoc) => {
            const appData = appDoc.data();
            const developerRef = doc(db, 'developers', appData.developerId);
            const developerSnap = await getDoc(developerRef);
            const developerData = developerSnap.data();
            
            if (!developerData) {
              console.warn(`Developer data not found for ID: ${appData.developerId}`);
              return null;
            }
            
            return {
              id: appDoc.id,
              developerId: appData.developerId,
              ideaId: appData.ideaId,
              name: `${developerData.firstName} ${developerData.lastName}`,
              experience: developerData.experience || '',
              skills: developerData.skills?.split(',').map((s: string) => s.trim()) || [],
              appliedDate: appData.createdAt?.toDate().toISOString().split('T')[0] || '',
              status: appData.status,
              coverLetter: appData.coverLetter,
              resume: appData.resume,
              email: developerData.email || '',
              github: developerData.github || '',
              university: developerData.university || '',
              degree: developerData.degree || '',
              graduationYear: developerData.graduationYear || '',
              photoURL: developerData.photoURL || '',
              whatsappNumber: appData.whatsappNumber || ''
            };
          })
        );

        // Filter out any null values and set the developer candidates
        setDeveloperCandidates(developerCandidatesData.filter((candidate): candidate is Candidate => candidate !== null));

        // Fetch investor applications for this recruiter's job posts
        const investorApplicationsRef = collection(db, 'investmentInterests');
        const investorQuery = query(
          investorApplicationsRef,
          where('recruiterId', '==', uid)
        );
        const investorApplicationsSnap = await getDocs(investorQuery);
        
        // Fetch investor details for each application
        const investorApplicationsData = await Promise.all(
          investorApplicationsSnap.docs.map(async (appDoc) => {
            const appData = appDoc.data();
            const investorRef = doc(db, 'investors', appData.investorId);
            const investorSnap = await getDoc(investorRef);
            const investorData = investorSnap.data();
            
            if (!investorData) {
              console.warn(`Investor data not found for ID: ${appData.investorId}`);
              return null;
            }
            
            return {
              id: appDoc.id,
              investorId: appData.investorId,
              ideaId: appData.ideaId,
              name: `${investorData.firstName} ${investorData.lastName}`,
              email: investorData.email || '',
              portfolioValue: investorData.portfolioValue || 0,
              investmentHistory: investorData.investmentHistory || [],
              investmentInterests: investorData.investmentInterests || '',
              netWorth: investorData.netWorth || '',
              pastInvestments: investorData.pastInvestments || '',
              appliedDate: appData.createdAt?.toDate().toISOString().split('T')[0] || '',
              status: appData.status,
              coverLetter: appData.coverLetter,
              photoURL: investorData.photoURL || '',
              whatsappNumber: appData.whatsappNumber || ''
            };
          })
        );

        // Filter out any null values and set the investor applications
        setInvestorApplications(investorApplicationsData.filter((application): application is InvestorApplication => application !== null));


        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state?.uid, toast]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    setFilteredDevelopers(
      developerCandidates.filter(candidate =>
        candidate.name.toLowerCase().includes(lowercasedQuery) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(lowercasedQuery))
      )
    );
    setFilteredInvestors(
      investorApplications.filter(application =>
        application.name.toLowerCase().includes(lowercasedQuery) ||
        application.investmentInterests.toLowerCase().includes(lowercasedQuery)
      )
    );
  }, [searchQuery, developerCandidates, investorApplications]);

  const handleProfileUpdate = async () => {
    if (!editedProfile || !location.state?.uid) return;

    try {
      const db = getFirestore();
      const profileRef = doc(db, 'recruiters', location.state.uid);
      await updateDoc(profileRef, { ...editedProfile } as { [key: string]: any });
      
      setProfile(editedProfile);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Company profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validateIdeaPost = (idea: IdeaPost | null): boolean => {
    if (!idea) return false;
    
    return !!(
      idea.cofounderRole &&
      idea.ideaDescription &&
      idea.responsibilities &&
      idea.idealCandidate
    );
  };

  const handlePostIdea = async () => {
    if (!ideaPost || !location.state?.uid) return;

    if (!validateIdeaPost(ideaPost)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const db = getFirestore();
      const ideaRef = collection(db, 'ideas');
      
      await addDoc(ideaRef, {
        ...ideaPost,
        recruiterId: location.state.uid,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      
      setIsPostingIdea(false);
      toast({
        title: "Success",
        description: "Your idea has been posted successfully",
      });
    } catch (error) {
      console.error('Error posting idea:', error);
      toast({
        title: "Error",
        description: "Failed to post idea. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <>
        {/* <Navbar /> */}
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const SideNavBar = ({ activeTab, setActiveTab, isSideMenuOpen, setIsSideMenuOpen, isFilterOpen, setIsFilterOpen }) => {
    return (
      <>
        <style jsx>{`
          .modern-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .modern-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .modern-scrollbar::-webkit-scrollbar-thumb {
            background-color: transparent;
            border-radius: 20px;
            transition: background-color 0.3s ease;
          }
          .modern-scrollbar:hover::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
          }
          .modern-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(107, 114, 128, 0.7);
          }
          .dark .modern-scrollbar:hover::-webkit-scrollbar-thumb {
            background-color: rgba(99, 102, 241, 0.5);
          }
          .dark .modern-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(99, 102, 241, 0.7);
          }
        `}</style>
        <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border border-gray-300 dark:bg-gray-900 dark:border-gray-700 shadow-lg z-50 transform transition-transform ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 overflow-hidden`}>
          <div className="h-full overflow-y-auto modern-scrollbar">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent dark:from-green-500 dark:to-blue-500">
                  Menu
                </h2>
                <button
                  onClick={() => setIsSideMenuOpen(false)}
                  className="text-gray-600 dark:text-gray-300 sm:hidden"
                >
                  <BsList className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex flex-col space-y-2">
                  {(['pending', 'reviewing', 'accepted', 'rejected'] as const).map((status) => (        
                    <Button
                      key={status}
                      variant={activeTab === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab(status)}
                      className={`flex items-center justify-start px-3 py-2 capitalize transition-all duration-300 ${
                        activeTab === status
                          ? 'bg-primary hover:bg-primary/90 dark:bg-blue-600 shadow-md'
                          : 'hover:bg-gray-100 text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <span>{status}</span>
                      {activeTab === status && (
                        <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                          {activeApplicationTab === 'developers' 
                            ? filteredDeveloperCandidates.length 
                            : filteredInvestorApplications.length}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center justify-start w-full px-3 py-2 border-gray-300 dark:border-blue-400 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <BsFilter className="h-4 w-4 mr-2" />
                    <span>Filter</span>
                  </Button>
                  {isFilterOpen && (
                    <div className="mt-2 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg py-2">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-200">Sort By</div>
                      <div className="px-4 py-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sortOption"
                            value="newest"
                            checked={sortOption === 'newest'}
                            onChange={() => setSortOption('newest')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">Newest</span>
                        </label>
                        <label className="flex items-center mt-2">
                          <input
                            type="radio"
                            name="sortOption"
                            value="oldest"
                            checked={sortOption === 'oldest'}
                            onChange={() => setSortOption('oldest')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">Oldest</span>
                        </label>
                      </div>
                      
                      <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-200">Experience Range</div>
                      <div className="px-4 py-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="experienceFilter"
                            value="all"
                            checked={experienceFilter === 'all'}
                            onChange={() => setExperienceFilter('all')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">All</span>
                        </label>
                        <label className="flex items-center mt-2">
                          <input
                            type="radio"
                            name="experienceFilter"
                            value="0-1"
                            checked={experienceFilter === '0-1'}
                            onChange={() => setExperienceFilter('0-1')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">0-1 years</span>
                        </label>
                        <label className="flex items-center mt-2">
                          <input
                            type="radio"
                            name="experienceFilter"
                            value="1-3"
                            checked={experienceFilter === '1-3'}
                            onChange={() => setExperienceFilter('1-3')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">1-3 years</span>
                        </label>
                        <label className="flex items-center mt-2">
                          <input
                            type="radio"
                            name="experienceFilter"
                            value="3-5"
                            checked={experienceFilter === '3-5'}
                            onChange={() => setExperienceFilter('3-5')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">3-5 years</span>
                        </label>
                        <label className="flex items-center mt-2">
                          <input
                            type="radio"
                            name="experienceFilter"
                            value="5+"
                            checked={experienceFilter === '5+'}
                            onChange={() => setExperienceFilter('5+')}
                            className="form-radio"
                          />
                          <span className="ml-2 dark:text-gray-200">5+ years</span>
                        </label>
                      </div>
                      
                      <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-200">Skills</div>
                      <div className="px-4 py-2 max-h-40 overflow-y-auto">
                        {availableSkills.map((skill) => (
                          <label key={skill} className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={selectedSkills.includes(skill)}
                              onChange={() => {
                                if (selectedSkills.includes(skill)) {
                                  setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                } else {
                                  setSelectedSkills([...selectedSkills, skill]);
                                }
                              }}
                              className="form-checkbox"
                            />
                            <span className="ml-2 dark:text-gray-200">{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // useEffect(() => {
  //   const filteredByCriteria = developerCandidates.filter(candidate => {
  //     // Filter by status
  //     if (candidate.status !== activeTab) return false;
      
  //     // Filter by search query
  //     if (searchQuery) {
  //       const query = searchQuery.toLowerCase();
  //       if (!candidate.name.toLowerCase().includes(query) && 
  //           !candidate.skills.some(skill => skill.toLowerCase().includes(query))) {
  //         return false;
  //       }
  //     }
      
  //     // Filter by experience
  //     if (experienceFilter !== 'all') {
  //       const exp = parseInt(candidate.experience);
  //       if (experienceFilter === '0-1' && (exp < 0 || exp > 1)) return false;
  //       if (experienceFilter === '1-3' && (exp < 1 || exp > 3)) return false;
  //       if (experienceFilter === '3-5' && (exp < 3 || exp > 5)) return false;
  //       if (experienceFilter === '5+' && exp < 5) return false;
  //     }
      
  //     // Filter by skills
  //     if (selectedSkills.length > 0) {
  //       if (!selectedSkills.some(skill => candidate.skills.includes(skill))) {
  //         return false;
  //       }
  //     }
      
  //     return true;
  //   });
    
  //   // Sort by date
  //   const sorted = [...filteredByCriteria].sort((a, b) => {
  //     const dateA = new Date(a.appliedDate);
  //     const dateB = new Date(b.appliedDate);
  //     return sortOption === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  //   });
    
  //   setFilteredDevelopers(sorted);
  // }, [
  //   developerCandidates, 
  //   activeTab, 
  //   searchQuery, 
  //   experienceFilter, 
  //   selectedSkills, 
  //   sortOption
  // ]);

  // const filteredDeveloperCandidates = developerCandidates.filter(candidate => candidate.status === activeTab);
  // const filteredInvestorApplications = investorApplications.filter(application => application.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar 
      theme={theme} 
      setIsSideMenuOpen={setIsSideMenuOpen} 
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      profileElement={
        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 ml-2"
        >
          <img 
            src={profile?.photoURL} 
            alt="Profile" 
            className="h-10 w-10 rounded-full border-2 border-gray-300 dark:border-blue-400" 
          />
        </button>
      }
    />
    
    <SideNavBar
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSideMenuOpen={isSideMenuOpen}
      setIsSideMenuOpen={setIsSideMenuOpen}
      isFilterOpen={isFilterOpen}
      setIsFilterOpen={setIsFilterOpen}
    />
    
    {isSideMenuOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
        onClick={() => setIsSideMenuOpen(false)}
      ></div>
    )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f0c29] dark:via-[#6b29e4] dark:to-[#24243e] text-black dark:text-white"
      >
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8 mt-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent dark:from-red-300 dark:to-blue-500">
              Founder Dashboard
            </h1>
            <div className="flex items-center gap-4 ">
            <div className="relative ">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 pl-10 border border-gray-300 rounded-full"
              />
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button 
              variant="outline"
              className="flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
              onClick={() => {
                setIdeaPost({
                  ...profile,
                  cofounderRole: '',
                  ideaDescription: '',
                  responsibilities: '',
                  idealCandidate: ''
                });
                setIsPostingIdea(true);
              }}
            >
              <BsBriefcase className="h-4 w-4" />
              Post Idea
            </Button>
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <Card className="lg:col-span-1 border-none shadow-xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Company Profile
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary"
                    onClick={() => {
                      setEditedProfile(profile);
                      setIsEditing(true);
                    }}
                  >
                    <BsPencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50/80">
                    <BsBuilding className="text-primary text-xl mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Company Details</h3>
                      <p className="text-gray-600 mt-1">{profile.companyName}</p>
                      <a 
                        href={profile.companyWebsite} 
                        className="text-primary hover:underline mt-1 block"
                      >
                        {profile.companyWebsite}
                      </a>
                      <p className="text-gray-600 mt-1">Size: {profile.companySize} employees</p>
                      <p className="text-gray-600">Stage: {profile.fundingStage}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50/80">
                    <BsCurrencyDollar className="text-primary text-xl mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Compensation</h3>
                      <p className="text-gray-600 mt-1">Equity: {profile.equityRange}%</p>
                      <p className="text-gray-600">Salary: ${profile.salaryRange}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50/80">
                    <HiOutlineDocumentText className="text-primary text-xl mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Role Requirements</h3>
                      <p className="text-gray-600 mt-1">{profile.roleDescription}</p>
                      <p className="text-gray-600 mt-2">Experience: {profile.experienceRequired} years</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.techStack.split(',').map((tech, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <Button
                  variant={activeApplicationTab === 'developers' ? "default" : "outline"}
                  onClick={() => setActiveApplicationTab('developers')}
                >
                  Developer Applications
                </Button>
                <Button
                  variant={activeApplicationTab === 'investors' ? "default" : "outline"}
                  onClick={() => setActiveApplicationTab('investors')}
                >
                  Investor Applications
                </Button>
              </div>
            </div>
            
            {/* Developer Applications Section */}
            {/* <div className="lg:col-span-2 space-y-6"> */}
            {activeApplicationTab === 'developers' && (
                <Card className="border-none shadow-xl bg-white">
                <CardHeader className="border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                        <HiOutlineUsers className="text-primary" />
                        Developer Applications
                    </h2>
                        <div className="flex gap-2">
                        {(['pending', 'reviewing', 'accepted', 'rejected'] as const).map((status) => (
                            <Button
                            key={status}
                            variant={activeTab === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(status)}
                            className={`capitalize ${
                                activeTab === status
                                ? 'bg-primary hover:bg-primary/90'
                                : 'hover:bg-gray-100'
                            }`}
                            >
                            {status}
                            {activeTab === status && (
                                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                                {filteredDeveloperCandidates.length}
                                </span>
                            )}
                            </Button>
                        ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Developer applications content */}
                    <div className="space-y-4">
                    {filteredDeveloperCandidates.map((candidate) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-lg shadow-xl border border-gray-100 hover:border-primary/50 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-gray-900">{candidate.name}</h3>
                            <p className="text-gray-600">Experience: {candidate.experience}</p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.map((tech, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <p className="text-gray-500">Applied: {candidate.appliedDate}</p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="hover:bg-primary hover:text-white transition-colors"
                                onClick={() => handleViewCandidate(candidate)}
                              >
                                View Profile
                              </Button>
                              {candidate.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="default"
                                    onClick={() => handleUpdateApplicationStatus(candidate.id, 'accepted')}
                                    disabled={isSubmitting}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleUpdateApplicationStatus(candidate.id, 'rejected')}
                                    disabled={isSubmitting}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredDeveloperCandidates.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-8 rounded-lg shadow-xl text-center border border-gray-100"
                      >
                        <p className="text-gray-500">No candidates found in {activeTab} status.</p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
                </Card>
                )}

                {/* Investor Applications Section */}
                {activeApplicationTab === 'investors' && (
                <Card className="border-none shadow-xl bg-white">
                <CardHeader className="border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                        <HiOutlineUsers className="text-primary" />
                        Investor Applications
                    </h2>
                        <div className="flex gap-2">
                        {(['pending', 'reviewing', 'accepted', 'rejected'] as const).map((status) => (
                            <Button
                            key={status}
                            variant={activeTab === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(status)}
                            className={`capitalize ${
                                activeTab === status
                                ? 'bg-primary hover:bg-primary/90'
                                : 'hover:bg-gray-100'
                            }`}
                            >
                            {status}
                            {activeTab === status && (
                                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                                {filteredInvestorApplications.length}
                                </span>
                            )}
                            </Button>
                        ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Investor applications content */}
                    <div className="space-y-4">
                    {filteredInvestorApplications.map((application) => (
                      <motion.div
                        key={application.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-lg shadow-xl border border-gray-100 hover:border-primary/50 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-gray-900">{application.name}</h3>
                            <p className="text-gray-600">Net Worth: {application.netWorth}</p>
                            <div className="flex flex-wrap gap-2">
                              {application.investmentInterests.split(',').map((tech, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <p className="text-gray-500">Applied: {application.appliedDate}</p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                // className="hover:bg-primary hover:text-white transition-colors"
                                onClick={() => handleViewInvestorApplication(application)}
                              >
                                View Profile
                              </Button>
                              {application.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="default"
                                    onClick={() => handleUpdateInvestorApplicationStatus(application.id, 'accepted')}
                                    disabled={isSubmitting}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateInvestorApplicationStatus(application.id, 'rejected')}
                                    disabled={isSubmitting}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredInvestorApplications.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-8 rounded-lg shadow-xl text-center border border-gray-100"
                      >
                        <p className="text-gray-500">No candidates found in {activeTab} status.</p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
                </Card>
                )}
            </div>
          </div>
        </div>
      </motion.div>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={editedProfile?.companyName}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, companyName: e.target.value} : null)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Company Website</label>
              <Input
                value={editedProfile?.companyWebsite}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, companyWebsite: e.target.value} : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company Size</label>
                <Input
                  value={editedProfile?.companySize}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, companySize: e.target.value} : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Funding Stage</label>
                <Input
                  value={editedProfile?.fundingStage}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, fundingStage: e.target.value} : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Equity Range (%)</label>
                <Input
                  value={editedProfile?.equityRange}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, equityRange: e.target.value} : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Salary Range ($)</label>
                <Input
                  value={editedProfile?.salaryRange}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, salaryRange: e.target.value} : null)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Role Description</label>
              <Textarea
                value={editedProfile?.roleDescription}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, roleDescription: e.target.value} : null)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tech Stack (comma-separated)</label>
              <Input
                value={editedProfile?.techStack}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, techStack: e.target.value} : null)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Experience Required (years)</label>
              <Input
                value={editedProfile?.experienceRequired}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, experienceRequired: e.target.value} : null)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleProfileUpdate}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isPostingIdea} onOpenChange={setIsPostingIdea}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
          <DialogHeader>
            <DialogTitle className="w-full sm:w-auto text-xl px-12 py-8 rounded-xl text-white shadow-lg 
              bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-500
              transform transition-all duration-300 ease-in-out
              hover:scale-105 hover:shadow-xl
              active:scale-95 active:shadow-md
              backdrop-blur-sm" >
              Post a New Idea
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 p-2">
            {/* Company Details Section */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BsBuilding className="text-primary" />
                  Company Details
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                    <Input 
                      value={ideaPost?.companyName} 
                      disabled 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company Website</label>
                    <Input 
                      value={ideaPost?.companyWebsite} 
                      disabled 
                      className="bg-gray-50/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company Size</label>
                    <Input 
                      value={ideaPost?.companySize} 
                      disabled 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Funding Stage</label>
                    <Input 
                      value={ideaPost?.fundingStage} 
                      disabled 
                      className="bg-gray-50/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation Section */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BsCurrencyDollar className="text-primary" />
                  Compensation
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Equity Range (%)</label>
                    <Input 
                      value={ideaPost?.equityRange} 
                      disabled 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Salary Range ($)</label>
                    <Input 
                      value={ideaPost?.salaryRange} 
                      disabled 
                      className="bg-gray-50/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Idea Details Section */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <HiOutlineDocumentText className="text-primary" />
                  Idea Details
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Co-founder Role</label>
                  <Input
                    value={ideaPost?.cofounderRole}
                    onChange={(e) => setIdeaPost(prev => prev ? {...prev, cofounderRole: e.target.value} : null)}
                    placeholder="e.g., Technical Co-founder, Product Co-founder"
                    className="border-gray-200 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Detailed Idea Description</label>
                  <Textarea
                    value={ideaPost?.ideaDescription}
                    onChange={(e) => setIdeaPost(prev => prev ? {...prev, ideaDescription: e.target.value} : null)}
                    placeholder="Describe your idea in detail..."
                    className="h-32 border-gray-200 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Key Responsibilities</label>
                  <Textarea
                    value={ideaPost?.responsibilities}
                    onChange={(e) => setIdeaPost(prev => prev ? {...prev, responsibilities: e.target.value} : null)}
                    placeholder="List the key responsibilities..."
                    className="h-24 border-gray-200 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ideal Candidate Profile</label>
                  <Textarea
                    value={ideaPost?.idealCandidate}
                    onChange={(e) => setIdeaPost(prev => prev ? {...prev, idealCandidate: e.target.value} : null)}
                    placeholder="Describe your ideal co-founder..."
                    className="h-24 border-gray-200 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technical Requirements Section */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BsBriefcase className="text-primary" />
                  Technical Requirements
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tech Stack</label>
                  <Input 
                    value={ideaPost?.techStack} 
                    disabled 
                    className="bg-gray-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Experience Required</label>
                  <Input 
                    value={ideaPost?.experienceRequired} 
                    disabled 
                    className="bg-gray-50/50"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsPostingIdea(false)}
                disabled={isSubmitting}
                className="hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePostIdea}
                disabled={isSubmitting || !validateIdeaPost(ideaPost)}
                className="bg-primary hover:bg-primary/90 text-white px-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span>Posting...</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  'Post Idea'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showCandidateDetails} onOpenChange={setShowCandidateDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {selectedCandidate.photoURL && (
                  <img
                    src={selectedCandidate.photoURL}
                    alt={selectedCandidate.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedCandidate.name}</h3>
                  <p className="text-gray-500">{selectedCandidate.email}</p>
                  {selectedCandidate.whatsappNumber && (
                    <p className="text-gray-500 flex items-center space-x-2">
                      <FaWhatsapp className="text-green-500 text-lg" />
                      <a 
                        href={`https://wa.me/${selectedCandidate.whatsappNumber.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center"
                      >
                        {selectedCandidate.whatsappNumber}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Experience</h4>
                  <p>{selectedCandidate.experience}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Education</h4>
                  <p>{selectedCandidate.degree} at {selectedCandidate.university}</p>
                  <p>Class of {selectedCandidate.graduationYear}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Cover Letter</h4>
                <p className="whitespace-pre-wrap">{selectedCandidate.coverLetter}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Resume</h4>
                <p className="whitespace-pre-wrap">{selectedCandidate.resume}</p>
              </div>

              {selectedCandidate.github && (
                <div>
                  <h4 className="font-semibold mb-2">GitHub</h4>
                  <a
                    href={selectedCandidate.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedCandidate.github}
                  </a>
                </div>
              )}

              {selectedCandidate.status === 'pending' && (
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedCandidate.id, 'accepted');
                      setShowCandidateDetails(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Accept Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedCandidate.id, 'rejected');
                      setShowCandidateDetails(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showInvestorApplicationDetails} onOpenChange={setShowInvestorApplicationDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Investor Details</DialogTitle>
          </DialogHeader>
          {selectedInvestorApplication && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {selectedInvestorApplication.photoURL && (
                  <img
                    src={selectedInvestorApplication.photoURL}
                    alt={selectedInvestorApplication.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedInvestorApplication.name}</h3>
                  <p className="text-gray-500">{selectedInvestorApplication.email}</p>
                  {selectedInvestorApplication.whatsappNumber && (
                    <p className="text-gray-500 flex items-center space-x-2">
                      <FaWhatsapp className="text-green-500 text-lg" />
                      <a 
                        href={`https://wa.me/${selectedInvestorApplication.whatsappNumber.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center"
                      >
                        {selectedInvestorApplication.whatsappNumber}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Net Worth</h4>
                  <p>{selectedInvestorApplication.netWorth}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Investment Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedInvestorApplication.investmentInterests.split(',').map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Past Investments</h4>
                <p className="whitespace-pre-wrap">{selectedInvestorApplication.pastInvestments}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Cover Letter</h4>
                <p className="whitespace-pre-wrap">{selectedInvestorApplication.coverLetter}</p>
              </div>

              

              {selectedInvestorApplication.status === 'pending' && (
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUpdateInvestorApplicationStatus(selectedInvestorApplication.id, 'accepted');
                      setShowInvestorApplicationDetails(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Accept Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUpdateInvestorApplicationStatus(selectedInvestorApplication.id, 'rejected');
                      setShowInvestorApplicationDetails(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>    
  );
};

export default RecruiterDashboard;
