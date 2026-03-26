import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import CanonicalTag from "./components/CanonicalTag/CanonicalTag";
import JoinUs from "./components/JoinUs/JoinUs";
import SmoothScroll from "./components/SmoothScroll/SmoothScroll";
import CityModal from "./components/CityModal/CityModal";
import LoadingBar from "./components/loadingBar/LoadingBar";
import Location from "./pages/home/Location";
import PhoneUs from "./components/JoinUs/PhoneUs";

// Lazy load components for better performance
const Home = lazy(() => import("./pages/home/Home"));
const Client = lazy(() => import("./pages/client/Client"));
const Blog = lazy(() => import("./pages/blog/Blog"));
const BlogDetails = lazy(() => import("./pages/blog/BlogDetails"));
const ApplyJob = lazy(() => import("./pages/apply-job/ApplyJob"));
const ContactUs = lazy(() => import("./pages/contact-us/ContactUs"));
const ServiceList = lazy(() => import("./pages/service/ServiceList"));
const CategoriesList = lazy(() => import("./pages/categories/CategoriesList"));
const BecomeVendor = lazy(() => import("./pages/became-vendor/BecomeVendor"));
const ServiceDetails = lazy(
  () => import("./pages/service-details/ServiceDetails"),
);
const Cart = lazy(() => import("./pages/cart/Cart"));
const AboutUs = lazy(() => import("./pages/about-us/AboutUs"));
const PaymentSuccess = lazy(() => import("./pages/payment/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/payment/PaymentFailed"));

function App() {
  const [showCityModal, setShowCityModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);

  useEffect(() => {
    const city = localStorage.getItem("city");
    setCurrentCity(city);
    if (!city) {
      setShowCityModal(true);
    }
  }, []);

  const handleCitySelect = (city, branchId) => {
    localStorage.setItem("city", city);
    localStorage.setItem("branch_id", branchId.toString());
    setCurrentCity(city);
    setShowCityModal(false);

    window.dispatchEvent(new CustomEvent("cityChanged", { detail: city }));
  };

  const handleCloseModal = () => {
    if (currentCity) {
      setShowCityModal(false);
    }
  };

  return (
    <>
      <CanonicalTag />
      <JoinUs />
      <PhoneUs />

      <SmoothScroll />
      {showCityModal && (
        <CityModal
          onSelectCity={handleCitySelect}
          onClose={currentCity ? handleCloseModal : undefined}
          selectedCity={currentCity}
        />
      )}
      <MainLayout>
        <Suspense fallback={<LoadingBar />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/location" element={<Location />} />
            <Route path="/client" element={<Client />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog-details/:blogs_slug" element={<BlogDetails />} />
            <Route path="/apply-job" element={<ApplyJob />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/service" element={<ServiceList />} />
            <Route path="/become-partner" element={<BecomeVendor />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/booking-failed" element={<PaymentFailed />} />

            <Route
              path="/:category_name/:service_name/:service_sub_name/pricing"
              element={<ServiceDetails />}
            />
            <Route
              path="/:category_name/:service_name/pricing"
              element={<ServiceDetails />}
            />
            <Route path="/:category_name" element={<CategoriesList />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </>
  );
}

export default App;
