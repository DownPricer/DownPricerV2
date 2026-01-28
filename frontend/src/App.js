// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from './components/ui/sonner';
// import { getUser } from './utils/auth';

// import { Home } from './pages/Home';
// import { Login } from './pages/Login';
// import { Signup } from './pages/Signup';
// import { ArticleDetail } from './pages/ArticleDetail';
// import { FaireDemande } from './pages/FaireDemande';
// import { DevenirVendeur } from './pages/DevenirVendeur';
// import { MesDemandes } from './pages/MesDemandes';
// import { NouvelleDemande } from './pages/NouvelleDemande';
// import { DemandeDetail } from './pages/DemandeDetail';
// import { MonCompte } from './pages/MonCompte';

// import { AdminDashboardEnrichiPage as AdminDashboardPage } from './pages/admin/AdminDashboardEnrichi';
// import { AdminArticlesPage } from './pages/AdminArticles';
// import { AdminCategoriesPage } from './pages/admin/Categories';
// import { AdminDemandesPage } from './pages/admin/Demandes';
// import { AdminVentesPage } from './pages/admin/Ventes';
// import { AdminPaiementsPage } from './pages/admin/AdminPaiements';
// import { AdminExpeditionsPage } from './pages/admin/AdminExpeditions';
// import { AdminAbonnementsPage } from './pages/admin/AdminAbonnements';
// import { AdminMiniSitesPage } from './pages/admin/AdminMiniSites';
// import { AdminUsersPage } from './pages/admin/Users';
// import { AdminParametresPage } from './pages/admin/Parametres';
// import { AdminParametresRichesPage } from './pages/admin/AdminParametresRiches';
// import { AdminExportsPage } from './pages/admin/AdminExports';
// import { AdminVenteDetail } from './pages/admin/VenteDetail';
// import { AdminDemandeDetail } from './pages/admin/DemandeDetail';
// import { AdminArticleDetailPage } from './pages/admin/ArticleDetail';

// import { SellerDashboard } from './pages/seller/SellerDashboard';
// import { SellerArticles } from './pages/seller/SellerArticles';
// import { SellerVentes } from './pages/seller/SellerVentes';
// import { SellerTresorerie } from './pages/seller/SellerTresorerie';
// import { SellerStats } from './pages/seller/SellerStats';
// import { SellerArticleDetail } from './pages/seller/SellerArticleDetail';
// import { SellerPaiementsEnAttente } from './pages/seller/SellerPaiementsEnAttente';
// import { SellerVenteDetail } from './pages/seller/SellerVenteDetail';
// import { MinisiteLanding } from './pages/MinisiteLanding';
// import { MinisiteCreate } from './pages/MinisiteCreate';
// import { MinisiteDashboard } from './pages/MinisiteDashboard';
// import { MinisitePublic } from './pages/MinisitePublic';
// import { MinisiteUpgrade } from './pages/MinisiteUpgrade';

// const ProtectedRoute = ({ children, requiredRole }) => {
//   const user = getUser();
  
//   if (!user) {
//     return <Navigate to="/login" />;
//   }
  
//   if (requiredRole && !user.roles.includes(requiredRole)) {
//     return <Navigate to="/" />;
//   }
  
//   return children;
// };

// function App() {
//   return (
//     <div className="App">
//       <BrowserRouter>
//         <Routes>
//           {/* Public routes */}
//           <Route path="/" element={<Home />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/article/:id" element={<ArticleDetail />} />
//           <Route path="/faire-demande" element={<FaireDemande />} />
//           <Route path="/devenir-vendeur" element={<DevenirVendeur />} />
          
//           {/* Client routes */}
//           <Route
//             path="/mes-demandes"
//             element={
//               <ProtectedRoute requiredRole="CLIENT">
//                 <MesDemandes />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/nouvelle-demande"
//             element={
//               <ProtectedRoute requiredRole="CLIENT">
//                 <NouvelleDemande />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/demande/:id"
//             element={
//               <ProtectedRoute requiredRole="CLIENT">
//                 <DemandeDetail />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/mon-compte"
//             element={
//               <ProtectedRoute>
//                 <MonCompte />
//               </ProtectedRoute>
//             }
//           />
          
//           {/* Minisite routes */}
//           <Route path="/minisite" element={<MinisiteLanding />} />
//           <Route 
//             path="/minisite/create" 
//             element={
//               <ProtectedRoute requiredRole="CLIENT">
//                 <MinisiteCreate />
//               </ProtectedRoute>
//             } 
//           />
//           <Route 
//             path="/minisite/dashboard" 
//             element={
//               <ProtectedRoute requiredRole="CLIENT">
//                 <MinisiteDashboard />
//               </ProtectedRoute>
//             } 
//           />
//           <Route path="/s/:slug" element={<MinisitePublic />} />
          
//           {/* Seller routes */}
//           <Route
//             path="/seller/dashboard"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerDashboard />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/articles"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerArticles />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/article/:id"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerArticleDetail />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/ventes"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerVentes />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/tresorerie"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerTresorerie />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/stats"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerStats />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/paiements-en-attente"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerPaiementsEnAttente />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/seller/ventes/:id"
//             element={
//               <ProtectedRoute requiredRole="SELLER">
//                 <SellerVenteDetail />
//               </ProtectedRoute>
//             }
//           />
          
//           {/* Admin routes */}
//           <Route
//             path="/admin/dashboard"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminDashboardPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/articles"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminArticlesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/articles/:id"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminArticleDetailPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/categories"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminCategoriesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/demandes"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminDemandesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/demandes/:id"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminDemandeDetail />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/ventes"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminVentesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/ventes/:id"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminVenteDetail />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/paiements"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminPaiementsPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/expeditions"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminExpeditionsPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/abonnements"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminAbonnementsPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/mini-sites"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminMiniSitesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/minisites"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminMiniSitesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/users"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminUsersPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/parametres"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminParametresRichesPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/admin/exports"
//             element={
//               <ProtectedRoute requiredRole="ADMIN">
//                 <AdminExportsPage />
//               </ProtectedRoute>
//             }
//           />
//         </Routes>
//         <Toaster position="top-right" />
//       </BrowserRouter>
//     </div>
//   );
// }

// export default App;
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { getUser, hasSTier } from './utils/auth';
import { AppLayout } from './components/AppLayout';

// --- IMPORTS DES PAGES ---
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { CGU } from './pages/CGU';
import { ArticleDetail } from './pages/ArticleDetail';
import { FaireDemande } from './pages/FaireDemande';
import { DevenirVendeur } from './pages/DevenirVendeur';
import { MesDemandes } from './pages/MesDemandes';
import { NouvelleDemande } from './pages/NouvelleDemande';
import { DemandeDetail } from './pages/DemandeDetail';
import { MonCompte } from './pages/MonCompte';

// --- ADMIN IMPORTS ---
import { AdminDashboardEnrichiPage as AdminDashboardPage } from './pages/admin/AdminDashboardEnrichi';
import { AdminArticlesPage } from './pages/AdminArticles';
import { AdminCategoriesPage } from './pages/admin/Categories';
import { AdminDemandesPage } from './pages/admin/Demandes';
import { AdminVentesPage } from './pages/admin/Ventes';
import { AdminPaiementsPage } from './pages/admin/AdminPaiements';
import { AdminExpeditionsPage } from './pages/admin/AdminExpeditions';
import { AdminAbonnementsPage } from './pages/admin/AdminAbonnements';
import { AdminMiniSitesPage } from './pages/admin/AdminMiniSites';
import { AdminUsersPage } from './pages/admin/Users';
import { AdminParametresPage } from './pages/admin/Parametres';
import { AdminParametresRichesPage } from './pages/admin/AdminParametresRiches';
import { AdminExportsPage } from './pages/admin/AdminExports';
import { AdminVenteDetail } from './pages/admin/VenteDetail';
import { AdminDemandeDetail } from './pages/admin/DemandeDetail';
import { AdminArticleDetailPage } from './pages/admin/ArticleDetail';

// --- SELLER IMPORTS ---
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { SellerArticles } from './pages/seller/SellerArticles';
import { SellerVentes } from './pages/seller/SellerVentes';
import { SellerTresorerie } from './pages/seller/SellerTresorerie';
import { SellerStats } from './pages/seller/SellerStats';
import { SellerArticleDetail } from './pages/seller/SellerArticleDetail';
import { SellerArticleNew } from './pages/seller/SellerArticleNew';
import { SellerPaiementsEnAttente } from './pages/seller/SellerPaiementsEnAttente';
import { SellerVenteDetail } from './pages/seller/SellerVenteDetail';

// --- MINISITE IMPORTS ---
import { MinisiteLanding } from './pages/MinisiteLanding';
import { MinisiteCreate } from './pages/MinisiteCreate';
import { MinisiteDashboard } from './pages/MinisiteDashboard';
import { MinisitePublic } from './pages/MinisitePublic';
import { MinisiteUpgrade } from './pages/MinisiteUpgrade'; // Importé ici

// --- PRO MODULE IMPORTS ---
import { ProDashboard } from './pages/pro/Dashboard';
import { ProArticles } from './pages/pro/Articles';
import { ProAddArticle } from './pages/pro/AddArticle';
import { ProPortfolio } from './pages/pro/Portfolio';
import { ProStatistics } from './pages/pro/Statistics';
import { ProAnalytics } from './pages/pro/Analytics';
import { ProAdmin } from './pages/pro/Admin';
import { ProLayout } from './components/ProLayout';

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = getUser();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const ProtectedSTierRoute = ({ children }) => {
  const user = getUser();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!hasSTier()) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/faire-demande" element={<FaireDemande />} />
            <Route path="/devenir-vendeur" element={<DevenirVendeur />} />
          
          {/* Client routes */}
          <Route
            path="/mes-demandes"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <MesDemandes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nouvelle-demande"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <NouvelleDemande />
              </ProtectedRoute>
            }
          />
          <Route
            path="/demande/:id"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <DemandeDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mon-compte"
            element={
              <ProtectedRoute>
                <MonCompte />
              </ProtectedRoute>
            }
          />
          
          {/* --- Minisite routes --- */}
          <Route path="/minisite" element={<MinisiteLanding />} />
          
          <Route 
            path="/minisite/create" 
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <MinisiteCreate />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/minisite/dashboard" 
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <MinisiteDashboard />
              </ProtectedRoute>
            } 
          />

          {/* C'EST CETTE ROUTE QUI MANQUAIT : */}
          <Route 
            path="/minisite/upgrade" 
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <MinisiteUpgrade />
              </ProtectedRoute>
            } 
          />

          {/* Route publique pour voir un minisite */}
          <Route path="/s/:slug" element={<MinisitePublic />} />
          
          {/* Seller routes */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/articles"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerArticles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/article/:id"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerArticleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/articles/new"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerArticleNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/ventes"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerVentes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/tresorerie"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerTresorerie />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/stats"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/paiements-en-attente"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerPaiementsEnAttente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/ventes/:id"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerVenteDetail />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/articles"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminArticlesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/articles/:id"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminArticleDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/demandes"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDemandesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/demandes/:id"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDemandeDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ventes"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminVentesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ventes/:id"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminVenteDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/paiements"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminPaiementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expeditions"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminExpeditionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/abonnements"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminAbonnementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mini-sites"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminMiniSitesPage />
              </ProtectedRoute>
            }
          />
          {/* Doublon gardé pour éviter de casser des liens existants */}
          <Route
            path="/admin/minisites"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminMiniSitesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/parametres"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminParametresRichesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exports"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminExportsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Pro Module Routes (S-tier uniquement) - Utilise ProLayout */}
          <Route
            path="/pro/dashboard"
            element={
              <ProtectedSTierRoute>
                <ProLayout>
                  <ProDashboard />
                </ProLayout>
              </ProtectedSTierRoute>
            }
          />
          <Route
            path="/pro/articles"
            element={
              <ProtectedSTierRoute>
                <ProLayout>
                  <ProArticles />
                </ProLayout>
              </ProtectedSTierRoute>
            }
          />
          <Route
            path="/pro/articles/new"
            element={
              <ProtectedSTierRoute>
                <ProLayout>
                  <ProAddArticle />
                </ProLayout>
              </ProtectedSTierRoute>
            }
          />
          <Route
            path="/pro/portfolio"
            element={
              <ProtectedSTierRoute>
                <ProLayout>
                  <ProPortfolio />
                </ProLayout>
              </ProtectedSTierRoute>
            }
          />
          <Route
            path="/pro/statistics"
            element={
              <ProtectedSTierRoute>
                <ProLayout>
                  <ProStatistics />
                </ProLayout>
              </ProtectedSTierRoute>
            }
          />
          <Route
            path="/pro/analytics"
            element={
              <ProtectedSTierRoute>
                <ProLayout>
                  <ProAnalytics />
                </ProLayout>
              </ProtectedSTierRoute>
            }
          />
          <Route
            path="/pro/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ProLayout>
                  <ProAdmin />
                </ProLayout>
              </ProtectedRoute>
            }
          />
          </Routes>
        </AppLayout>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;