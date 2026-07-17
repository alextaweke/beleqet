// // app/jobs/page.tsx - This is the JOBS LISTING page
// "use client";

// import { useEffect, useState } from "react";
// import {
//   Search,
//   MapPin,
//   Briefcase,
//   Filter,
//   ChevronDown,
//   ChevronUp,
//   X,
// } from "lucide-react";
// import JobCard from "@/components/JobCard";
// import { jobsService } from "@/lib/jobs";
// import { jobTypeLabels } from "@/types/jobs";
// import type { JobResponse, Category } from "@/lib/jobs";

// export default function JobsPage() {
//   const [jobs, setJobs] = useState<JobResponse[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [totalJobs, setTotalJobs] = useState(0);
//   const [query, setQuery] = useState("");
//   const [location, setLocation] = useState("");
//   const [category, setCategory] = useState("");
//   const [type, setType] = useState<string>("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [showAllCategories, setShowAllCategories] = useState(false);
//   const CATEGORIES_TO_SHOW = 5;

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const data = await jobsService.getCategories();
//         setCategories(Array.isArray(data) ? data : []);
//       } catch (error) {
//         console.error("Failed to fetch categories:", error);
//         setCategories([]);
//       }
//     };
//     fetchCategories();
//   }, []);

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         setLoading(true);
//         const params: any = {};
//         if (query) params.q = query;
//         if (location) params.location = location;
//         if (category) params.category = category;
//         if (type) params.type = type;

//         const response = await jobsService.findAll(params);
//         setJobs(response?.items || []);
//         setTotalJobs(response?.total || 0);
//       } catch (err: any) {
//         console.error("Error fetching jobs:", err);
//         setError(err.message || "Failed to load jobs");
//       } finally {
//         setLoading(false);
//       }
//     };

//     const timeoutId = setTimeout(fetchJobs, 300);
//     return () => clearTimeout(timeoutId);
//   }, [query, location, category, type]);

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//   };

//   const getCategoryLabel = (slug: string) => {
//     const cat = categories.find((c) => c.slug === slug);
//     return cat?.label || slug;
//   };

//   const getTypeLabel = (value: string) => {
//     return jobTypeLabels[value as keyof typeof jobTypeLabels] || value;
//   };

//   const clearAllFilters = () => {
//     setQuery("");
//     setLocation("");
//     setCategory("");
//     setType("");
//   };

//   const visibleCategories = showAllCategories
//     ? categories
//     : categories.slice(0, CATEGORIES_TO_SHOW);

//   if (loading && jobs.length === 0) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="container mx-auto px-4 py-10 max-w-7xl">
//           <div className="flex justify-center items-center min-h-[400px]">
//             <div className="text-center">
//               <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
//               <p className="mt-4 text-gray-600">Loading jobs...</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="container mx-auto px-4 py-10 max-w-7xl">
//           <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
//             <p className="text-red-600 font-semibold">Error: {error}</p>
//             <button
//               onClick={() => window.location.reload()}
//               className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-4 py-8 max-w-7xl">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
//           <p className="text-gray-600 mt-1">
//             {totalJobs.toLocaleString()} jobs found
//           </p>
//         </div>

//         {/* Search Bar */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 mb-6">
//           <form onSubmit={handleSearch} className="flex flex-col md:flex-row">
//             <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
//               <Search className="h-5 w-5 text-gray-400 shrink-0" />
//               <input
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search for jobs..."
//                 className="w-full text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
//               />
//             </div>
//             <div className="hidden md:block w-px bg-gray-200" />
//             <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
//               <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
//               <input
//                 value={location}
//                 onChange={(e) => setLocation(e.target.value)}
//                 placeholder="Location"
//                 className="w-full text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
//               />
//             </div>
//             <button
//               type="submit"
//               className="md:ml-1 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
//             >
//               Search
//             </button>
//           </form>
//         </div>

//         {/* Active Filters - Chips */}
//         {(category || type || query || location) && (
//           <div className="flex flex-wrap items-center gap-2 mb-4">
//             <span className="text-xs text-gray-500 font-medium mr-1">
//               Active filters:
//             </span>
//             {query && (
//               <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
//                 {query}
//                 <button
//                   onClick={() => setQuery("")}
//                   className="hover:text-red-500 transition-colors"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}
//             {location && (
//               <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
//                 📍 {location}
//                 <button
//                   onClick={() => setLocation("")}
//                   className="hover:text-red-500 transition-colors"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}
//             {category && (
//               <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
//                 {getCategoryLabel(category)}
//                 <button
//                   onClick={() => setCategory("")}
//                   className="hover:text-red-500 transition-colors"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}
//             {type && (
//               <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
//                 {getTypeLabel(type)}
//                 <button
//                   onClick={() => setType("")}
//                   className="hover:text-red-500 transition-colors"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}
//             <button
//               onClick={clearAllFilters}
//               className="text-xs text-gray-500 hover:text-red-500 transition-colors ml-1"
//             >
//               Clear all
//             </button>
//           </div>
//         )}

//         {/* Filter Toggle - Mobile */}
//         <button
//           onClick={() => setShowFilters(!showFilters)}
//           className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 mb-4 hover:bg-gray-50 transition-colors w-full justify-center"
//         >
//           <Filter className="h-4 w-4" />
//           Filters
//           {(category || type) && (
//             <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//               {[category, type].filter(Boolean).length} active
//             </span>
//           )}
//         </button>

//         <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
//           {/* Filters Sidebar */}
//           <aside
//             className={`${showFilters ? "block" : "hidden"} lg:block space-y-6`}
//           >
//             {/* Categories */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
//                 <Briefcase className="h-4 w-4 text-gray-500" />
//                 Categories
//                 <span className="ml-auto text-xs text-gray-400">
//                   {categories.length}
//                 </span>
//               </h3>
//               <div className="space-y-1">
//                 <button
//                   onClick={() => setCategory("")}
//                   className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
//                     category === ""
//                       ? "bg-green-50 text-green-700 font-medium"
//                       : "text-gray-600 hover:bg-gray-50"
//                   }`}
//                 >
//                   All Categories
//                 </button>
//                 {visibleCategories.map((cat) => (
//                   <button
//                     key={cat.id}
//                     onClick={() => setCategory(cat.slug)}
//                     className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
//                       category === cat.slug
//                         ? "bg-green-50 text-green-700 font-medium"
//                         : "text-gray-600 hover:bg-gray-50"
//                     }`}
//                   >
//                     <span>{cat.label}</span>
//                   </button>
//                 ))}
//               </div>
//               {categories.length > CATEGORIES_TO_SHOW && (
//                 <button
//                   onClick={() => setShowAllCategories(!showAllCategories)}
//                   className="flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium transition-colors w-full justify-center"
//                 >
//                   {showAllCategories ? (
//                     <>
//                       <ChevronUp className="h-4 w-4" />
//                       Show less
//                     </>
//                   ) : (
//                     <>
//                       <ChevronDown className="h-4 w-4" />
//                       Show {categories.length - CATEGORIES_TO_SHOW} more
//                     </>
//                   )}
//                 </button>
//               )}
//             </div>

//             {/* Job Types */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h3 className="text-sm font-semibold text-gray-900 mb-4">
//                 Job Type
//               </h3>
//               <div className="space-y-1">
//                 <button
//                   onClick={() => setType("")}
//                   className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
//                     type === ""
//                       ? "bg-green-50 text-green-700 font-medium"
//                       : "text-gray-600 hover:bg-gray-50"
//                   }`}
//                 >
//                   All Types
//                 </button>
//                 {Object.entries(jobTypeLabels).map(([value, label]) => (
//                   <button
//                     key={value}
//                     onClick={() => setType(value)}
//                     className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
//                       type === value
//                         ? "bg-green-50 text-green-700 font-medium"
//                         : "text-gray-600 hover:bg-gray-50"
//                     }`}
//                   >
//                     {label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </aside>

//           {/* Job Listings */}
//           <div>
//             {jobs.length === 0 ? (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
//                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <Briefcase className="h-8 w-8 text-gray-400" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   No jobs found
//                 </h3>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Try adjusting your search or clearing your filters.
//                 </p>
//                 {(query || location || category || type) && (
//                   <button
//                     onClick={clearAllFilters}
//                     className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
//                   >
//                     Clear all filters
//                   </button>
//                 )}
//               </div>
//             ) : (
//               <>
//                 <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
//                   <p className="text-sm text-gray-600">
//                     Showing{" "}
//                     <span className="font-medium text-gray-900">
//                       {jobs.length}
//                     </span>{" "}
//                     jobs
//                   </p>
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs text-gray-400">Sort by:</span>
//                     <select className="text-sm border-0 bg-transparent font-medium text-gray-700 focus:ring-0">
//                       <option>Most Recent</option>
//                       <option>Relevance</option>
//                       <option>Salary (High to Low)</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {jobs.map((job) => (
//                     <JobCard key={job.id} job={job} />
//                   ))}
//                 </div>
//                 {jobs.length >= 20 && (
//                   <div className="text-center mt-8">
//                     <button className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
//                       Load More Jobs
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
