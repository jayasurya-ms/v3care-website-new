import React, { useEffect, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import axios from "axios";

import { useDispatch } from "react-redux";
import * as Icon from "react-feather";
import "./ServiceDetails.css";
import { Helmet } from "react-helmet-async";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  BASE_URL,
  NO_IMAGE_URL,
  SERVICE_DETAILS_IMAGE_URL,
} from "../../config/BaseUrl";
import { addToCart } from "../../redux/slices/CartSlice";
import { ChevronDown, ChevronUp, Loader } from "lucide-react";
import { getCurrentDate } from "../../utils/getCurrentDate";
import { useLocalStorage } from "../../hooks/useLocalStorage";
const ServiceDetails = () => {
  const dispatch = useDispatch();

  const params = useParams();

  const {
    id = "",
    category_name = "",
    service_name = "",
    service_sub_name = "",

    service_id = "",
    service_sub_id = "",
  } = params;

  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const branch_id = localStorage.getItem("branch_id");
  const current_date = getCurrentDate();
  const cityLower = (useLocalStorage("city") || "").toLowerCase();
  const city = localStorage.getItem("city") || "your area";
  const message = `We're not available in ${city} at the moment, but we're expanding and will be there soon!`;

  const [servicePrices, setServicePrices] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [serviceCards, setServiceCards] = useState([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [serviceFAQ, setServiceFAQ] = useState([]);
  const [serviceMeta, setServiceMeta] = useState(null);
  const [serviceSub, setServiceSub] = useState(null);

  const [serviceIncludes, setServiceIncludes] = useState([]);

  const [openIndices, setOpenIndices] = useState([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 600);
  const toggleIndex = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const showNotification = (message, type) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (cityLower && service_name) {
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split("/");

      if (pathParts.length >= 2) {
        const categoryPart = pathParts[1];

        const cleanCategoryName = categoryPart.replace(/-in-[a-zA-Z]+$/, "");
        const newCategoryPart = `${cleanCategoryName}-in-${cityLower}`;
        pathParts[1] = newCategoryPart;

        const newPath = pathParts.join("/");

        if (currentPath !== newPath) {
          window.history.replaceState(null, "", newPath);
        }
      }
    }
  }, [cityLower, service_name, service_sub_name]);
  const fetchServicePrices = async () => {
    try {
      setPriceLoading(true);
      setPriceError(null);

      const response = await axios.post(
        `${BASE_URL}/api/panel-fetch-web-service-price-out`,
        {
          branch_id: branch_id,
          order_service: service_name,
          order_service_sub: service_sub_name,
          order_service_date: current_date,
        },
      );

      setServicePrices(response.data.serviceprice || []);
      // Set the service meta data
      if (response.data.service) {
        setServiceMeta(response.data.service);
      }
      if (response.data.serviceSub) {
        setServiceSub(response.data.serviceSub);
      }
    } catch (error) {
      console.error("Error fetching service prices:", error);
      setPriceError("Failed to load service prices. Please try again.");
    } finally {
      setPriceLoading(false);
    }
  };

  const fetchServiceCard = async () => {
    try {
      setCardLoading(true);
      setCardError(null);

      const response = await axios.post(
        `${BASE_URL}/api/panel-fetch-web-service-details-out`,
        {
          service_id: service_name,
          service_sub_id: service_sub_name,
        },
      );

      setServiceCards(response.data.serviceDetails || []);
      const faqs = response.data.serviceFAQ || [];
      setServiceFAQ(faqs);
      setOpenIndices(faqs.map((_, i) => i));
      if (response.data.serviceIncludes?.service_includes) {
        setServiceIncludes(
          response.data.serviceIncludes.service_includes.split(","),
        );
      }
    } catch (error) {
      console.error("Error fetching service card :", error);
      setCardError("Failed to load service card. Please try again.");
    } finally {
      setCardLoading(false);
    }
  };

  useEffect(() => {
    if (service_name && branch_id) {
      fetchServicePrices();
    }
  }, [service_name, service_sub_name, branch_id]);

  useEffect(() => {
    if (service_name) {
      fetchServiceCard();
    }
  }, [service_name, service_sub_name]);

  useEffect(() => {
    if (servicePrices.length > 0) {
      setSelectedPrices([servicePrices[0]]);
    }
  }, [servicePrices]);

  const totalPrice = selectedPrices.reduce(
    (sum, price) => sum + parseFloat(price.service_price_amount),
    0,
  );
  const totalOriginalPrice = selectedPrices.reduce(
    (sum, price) => sum + parseFloat(price.service_price_rate),
    0,
  );

  const togglePriceSelection = (price) => {
    setSelectedPrices((prev) => {
      if (prev.some((p) => p.id === price.id)) {
        return [];
      }

      return [price];
    });
  };
  return (
    <>
      <Helmet>
        <title>
          {serviceMeta?.service && serviceMeta.service !== "null"
            ? serviceMeta.service
            : "Best house cleaning service | V3 Care"}
        </title>
        {serviceMeta?.service_meta_title &&
          serviceMeta.service_meta_title !== "null" && (
            <meta name="title" content={serviceMeta.service_meta_title} />
          )}
        {serviceMeta?.service_meta_description &&
          serviceMeta.service_meta_description !== "null" && (
            <meta
              name="description"
              content={serviceMeta.service_meta_description}
            />
          )}
        {serviceMeta?.service_slug && (
          <meta name="slug" content={serviceMeta.service_slug} />
        )}
        {serviceMeta?.service_meta_full_length && (
          <meta
            name="full_length"
            content={serviceMeta.service_meta_full_length}
          />
        )}
      </Helmet>

      <div
        className={`fixed z-1000 max-w-[300px] w-full ${isSmallScreen ? "top-[105px] left-1/2 transform -translate-x-1/2" : "top-[110px] right-5"}`}
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex justify-between items-center w-full rounded mb-2 p-2 text-sm shadow animate-[slideDown_0.3s_ease-out] ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            <span className="flex-1">{notification.message}</span>
            <button
              className="p-1 text-xs"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="min-h-screen bg-gray-50 ">
        {/* <div
          className={`lg:hidden fixed bottom-0 left-0 right-0 w-full text-white z-[1000] shadow-md transition-all duration-300 overflow-hidden ${
            showBreakdown ? 'rounded-t-none' : 'rounded-t-xl'
          }`}
          style={{
            background: 'linear-gradient(90deg, #4361ee 0%, #7209b7 100%)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_3s_infinite]"></div>
  
          <div className="w-full py-2 px-3">
            <div
              className="flex items-center"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              <div className="flex-grow">
                <div className="flex items-center">
                  <span className="bg-[#ffe600] text-[#7209b7] font-bold rounded-full px-2 py-0.5 mr-2">
                    {selectedPrices.length}
                  </span>
                  <div>
                    <span className="font-bold">₹{totalPrice.toFixed(2)}</span>
                    {totalOriginalPrice > 0 && (
                      <small className="ml-2 line-through opacity-75">
                        ₹{totalOriginalPrice.toFixed(2)}
                      </small>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <i
                  className={`text-white text-lg ${
                    showBreakdown ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'
                  }`}
                ></i>
              </div>
            </div>
  
            {showBreakdown && (
              <div className="mt-3 pt-2 border-t border-white/20">
                {selectedPrices.map((price, index) => (
                  <div
                    key={index}
                    className="flex justify-between mb-2 text-sm"
                  >
                    <span>{price.service_price_for}</span>
                    <span>₹{price.service_price_amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> */}

        <div className="py-8">
          <div className="max-w-340  mx-auto px-4 sm:px-6 lg:px-8">
            {/* <p className='font-medium text-xl pb-2 px-2 text-transparent  bg-gradient-to-r from-red-700  to-blue-900 bg-clip-text'>
          Weekend rates should be set differently from weekday prices 
          </p> */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-7/12">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="mb-2">
                      <div className="flex items-center justify-between flex-wrap mb-3">
                        <div className="flex items-center flex-wrap">
                          <h1 className="text-xl md:text-2xl font-bold text-black mb-0">
                            {serviceMeta?.service || "Service Name"}
                            {serviceSub?.service_sub && (
                              <span className="text-gray-500 text-sm">
                                &nbsp;( {serviceSub.service_sub})
                              </span>
                            )}
                          </h1>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="mb-6">
                        <h2 className="text-md text-gray-700 font-semibold ">
                          Service Offered
                        </h2>
                        <div className="pt-2">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            {priceLoading ? (
                              <div className="flex flex-col text-center items-center">
                                <Loader className="text-gray-500 animate-spin" />
                                <p className="mt-3 text-gray-500">
                                  Loading prices...
                                </p>
                              </div>
                            ) : priceError ? (
                              <div className="flex items-center justify-between py-2 px-3 bg-red-100 text-red-800 rounded text-sm">
                                <div>{priceError}</div>
                                <button
                                  className="text-red-800 hover:text-red-900 text-sm border border-red-800 rounded px-2 py-1"
                                  onClick={fetchServicePrices}
                                >
                                  Try Again
                                </button>
                              </div>
                            ) : servicePrices.length > 0 ? (
                              servicePrices.map((price) => (
                                <div
                                  key={price.id}
                                  className={`flex items-center justify-between mb-2 p-2 cursor-pointer transition-all duration-300 rounded ${
                                    selectedPrices.some(
                                      (p) => p.id === price.id,
                                    )
                                      ? "border border-black bg-blue-50"
                                      : "border border-gray-200 bg-white"
                                  }`}
                                  onClick={() => togglePriceSelection(price)}
                                >
                                  <div className="flex items-center">
                                    <span className="shrink-0 mr-2">
                                      {selectedPrices.some(
                                        (p) => p.id === price.id,
                                      ) ? (
                                        <i className="ri-checkbox-circle-fill text-black text-lg"></i>
                                      ) : (
                                        <i className="ri-checkbox-blank-circle-line text-gray-400 text-lg"></i>
                                      )}
                                    </span>
                                    <h6 className="text-sm font-medium">
                                      {price.service_price_for}
                                    </h6>
                                  </div>
                                  <div className="text-right">
                                    <h6 className="text-sm font-medium text-black">
                                      {price.service_price_amount == 0 ? (
                                        "Inspection"
                                      ) : (
                                        <>₹ {price.service_price_amount}</>
                                      )}
                                    </h6>
                                    <p className="text-xs text-gray-500 line-through">
                                      {price.service_price_rate != 0 && (
                                        <>₹{price.service_price_rate}</>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-blue-100 text-blue-800 py-2 px-3 rounded text-sm">
                                {message}
                              </div>
                            )}
                          </div>
                          <div className="pt-2">
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <div className="flex gap-3">
                                <button
                                  className="flex-1 flex items-center justify-center gap-1 bg-black text-white rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-white hover:text-black hover:border hover:border-black h-10"
                                  onClick={() => {
                                    if (selectedPrices.length === 0) {
                                      showNotification(
                                        "Please select at least one service",
                                        "error",
                                      );
                                      return;
                                    }
                                    selectedPrices.forEach((price) => {
                                      dispatch(
                                        addToCart({
                                          id: price.id,
                                          service_price_for:
                                            price.service_price_for,
                                          service_price_rate:
                                            price.service_price_rate,
                                          service_price_amount:
                                            price.service_price_amount,
                                          service_id: serviceMeta?.id || "",
                                          service_name:
                                            serviceMeta?.service || "",
                                          service_sub_id: serviceSub?.id || "",
                                          service_sub_name:
                                            serviceSub?.service_sub || "",
                                          service_slug: service_name,
                                          service_sub_slug: service_sub_name,
                                          service_label: price?.status_label,
                                        }),
                                      );
                                    });
                                    showNotification(
                                      "Service added to cart",
                                      "success",
                                    );
                                  }}
                                >
                                  <i className="ri-shopping-cart-2-line"></i>
                                  Add to Cart
                                </button>

                                <button
                                  className="flex-1 flex items-center justify-center gap-1 bg-white text-black border border-black rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-black hover:text-white h-10"
                                  onClick={() => {
                                    if (selectedPrices.length === 0) {
                                      showNotification(
                                        "Please select at least one service",
                                        "error",
                                      );
                                      return;
                                    }
                                    navigate("/cart");
                                    selectedPrices.forEach((price) => {
                                      dispatch(
                                        addToCart({
                                          id: price.id,
                                          service_price_for:
                                            price.service_price_for,
                                          service_price_rate:
                                            price.service_price_rate,
                                          service_price_amount:
                                            price.service_price_amount,
                                          service_id: serviceMeta?.id || "",
                                          service_name:
                                            serviceMeta?.service || "",
                                          service_sub_id: serviceSub?.id || "",
                                          service_sub_name:
                                            serviceSub?.service_sub || "",
                                          service_slug: service_name,
                                          service_sub_slug: service_sub_name,
                                          service_label: price?.status_label,
                                        }),
                                      );
                                    });
                                  }}
                                >
                                  <i className="ri-shopping-bag-3-line"></i>
                                  Checkout
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h2 className="text-md text-gray-700 font-semibold">
                          Includes
                        </h2>
                        <div className="pt-3">
                          <div className="bg-gray-50/80 p-3 pb-2 rounded-lg">
                            {serviceIncludes.map((include, index) => (
                              <p
                                className="inline-flex text-sm text-gray-600 items-center mb-2 mr-4"
                                key={index}
                              >
                                <Icon.CheckSquare className=" text-green-500 mr-2 w-4 h-4" />

                                {include.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ----------------------------------------Photo only for mobile start--------------------------------------------------- */}
                      <div className="block sm:hidden">
                        {cardLoading ? (
                          <div className="flex flex-col text-center items-center">
                            <Loader className="text-gray-500 animate-spin" />
                            <p className="mt-3 text-gray-500">
                              Loading service card...
                            </p>
                          </div>
                        ) : cardError ? (
                          <div className="flex items-center justify-between bg-red-100 text-red-800 rounded-md p-3">
                            <div>{cardError}</div>
                            <button
                              className="text-red-800 hover:text-red-900 text-sm border border-red-800 rounded px-2 py-1"
                              onClick={fetchServiceCard}
                            >
                              Try Again
                            </button>
                          </div>
                        ) : (
                          serviceCards.length > 0 &&
                          serviceCards.map((card) => (
                            <div
                              key={card.id}
                              className="bg-white rounded-md shadow-sm overflow-hidden mb-4"
                            >
                              <div className="w-full">
                                {/* <img
                          src={`${SERVICE_DETAILS_IMAGE_URL}/${card.serviceDetails_image}`}
                          className="w-full h-auto rounded-t-md"
                          alt={card?.serviceDetails_name}
                        /> */}

                                <LazyLoadImage
                                  src={`${SERVICE_DETAILS_IMAGE_URL}/${card.serviceDetails_image}`}
                                  className="w-full h-auto rounded-t-md"
                                  alt={card?.serviceDetails_name}
                                  effect="blur"
                                  width="100%"
                                  height="100%"
                                  onError={(e) => {
                                    const target = e.target;
                                    target.src = `${NO_IMAGE_URL}`;
                                  }}
                                />
                              </div>
                              <div className="p-3">
                                <h1 className="text-lg font-medium mb-1">
                                  {card?.serviceDetails_name}
                                </h1>
                                <div className="prose max-w-none">
                                  <ReactQuill
                                    value={card?.serviceDetails || ""}
                                    readOnly={true}
                                    theme={null}
                                    modules={{ toolbar: false }}
                                    className="read-only-quill-service"
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {/* ----------------------------------------------------------------------------------------------------------------- */}
                      {serviceFAQ?.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold mb-4">FAQ's</h2>
                          <div className="space-y-3">
                            {serviceFAQ.map((faq, index) => {
                              const isOpen = openIndices.includes(index);
                              return (
                                <div
                                  key={index}
                                  className="bg-gray-50 rounded-md border border-gray-200 p-4"
                                >
                                  <div
                                    className="flex justify-between items-center cursor-pointer "
                                    onClick={() => toggleIndex(index)}
                                  >
                                    <h3 className="text-md font-normal">
                                      {faq.service_faq_heading}
                                    </h3>
                                    {isOpen ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </div>
                                  {isOpen && (
                                    <div className="mt-2 text-sm text-gray-700 transition-all duration-300 ease-in-out">
                                      <p>{faq.service_faq_description}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-5/12">
                <div className="hidden lg:block bg-white rounded-md shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-0">Starts From</p>
                      <h4 className="text-2xl font-bold">
                        <span>
                          {selectedPrices.some(
                            (price) =>
                              parseFloat(price.service_price_amount) === 0,
                          )
                            ? "Inspection"
                            : `₹${totalPrice.toFixed(2)}`}
                        </span>
                        {totalOriginalPrice > 0 && (
                          <span className="line-through text-gray-500 ml-2">
                            ₹{totalOriginalPrice.toFixed(2)}
                          </span>
                        )}
                      </h4>
                    </div>
                    {selectedPrices.some(
                      (price) => parseFloat(price.service_price_amount) === 0,
                    ) ? null : (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center">
                        <i className="ri-percent-line mr-1"></i>
                        {Math.round(
                          (1 - totalPrice / totalOriginalPrice) * 100,
                        ) || 0}
                        % Offer
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block">
                  {cardLoading ? (
                    <div className="flex flex-col text-center items-center">
                      <Loader className="text-gray-500 animate-spin" />
                      <p className="mt-3 text-gray-500">
                        Loading service card...
                      </p>
                    </div>
                  ) : cardError ? (
                    <div className="flex items-center justify-between bg-red-100 text-red-800 rounded-md p-3">
                      <div>{cardError}</div>
                      <button
                        className="text-red-800 hover:text-red-900 text-sm border border-red-800 rounded px-2 py-1"
                        onClick={fetchServiceCard}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    serviceCards.length > 0 &&
                    serviceCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-md shadow-sm overflow-hidden mb-4"
                      >
                        <div className="w-full">
                          {/* <img
                          src={`${SERVICE_DETAILS_IMAGE_URL}/${card.serviceDetails_image}`}
                          className="w-full h-auto rounded-t-md"
                          alt={card?.serviceDetails_name}
                        /> */}

                          <LazyLoadImage
                            src={`${SERVICE_DETAILS_IMAGE_URL}/${card.serviceDetails_image}`}
                            className="w-full h-auto rounded-t-md"
                            alt={card?.serviceDetails_name}
                            effect="blur"
                            width="100%"
                            height="100%"
                            onError={(e) => {
                              const target = e.target;
                              target.src = `${NO_IMAGE_URL}`;
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <h1 className="text-lg font-medium mb-1">
                            {card?.serviceDetails_name}
                          </h1>
                          <div className="prose max-w-none">
                            <ReactQuill
                              value={card?.serviceDetails || ""}
                              readOnly={true}
                              theme={null}
                              modules={{ toolbar: false }}
                              className="read-only-quill-service"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetails;
//sajid
