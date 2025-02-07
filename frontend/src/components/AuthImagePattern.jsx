import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AuthImagePattern = ({ title, subtitle }) => {
  const images = [
    "https://media.istockphoto.com/id/1175607799/photo/asian-woman-taking-selfie-isolaed-on-yellow-background.jpg?s=612x612&w=0&k=20&c=IJcW6orWQCGJQfYfLMJZTJg-KX5ipnsTf-T2CTS-P8A=", 
    "https://img.freepik.com/premium-photo/woman-with-social-media-logos-floating-around-her-head-purple-background_1204450-64017.jpg",   
    "https://cdn.create.vista.com/api/media/small/332310438/stock-photo-positive-attentive-couple-chatting-smartphones-yellow-background", 
    "https://img.freepik.com/free-photo/happy-cheerful-woman-looks-screen-smart-phone-enjoys-online-chatting-types-text-message-surfs-social-networks-dressed-casually-poses-against-blue-wall_273609-44639.jpg",
    "https://img.freepik.com/free-photo/beautiul-curly-haired-young-woman-holds-mobile-phone-reads-awesome-news-online-looks-gladfully-uses-free-internet-wears-yellow-jacket-isolated-pink-wall-technology-concept_273609-48759.jpg", 
    "https://img.freepik.com/premium-photo/happy-mature-senior-asian-woman-holding-smartphone-using-mobile-online-apps-smiling-old-middle-aged-lady-texting-sms-message-chatting-phone-isolated-red-background_255757-9885.jpg", 
    "https://img.freepik.com/free-photo/siblings-home-using-mobile_23-2148872752.jpg", 
    "https://img.freepik.com/free-photo/couple-using-their-mobile-phones_23-2148155735.jpg", 
    "https://img.freepik.com/free-photo/close-up-portrait-attractive-young-woman-isolated_273609-35736.jpg",
  ];

  // State to track images visibility for fade-in animation
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <motion.div
          className="grid grid-cols-3 gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: hasLoaded ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          {images.map((image, i) => (
            <motion.div
              key={i}
              className={`aspect-square rounded-2xl overflow-hidden transform transition-all duration-300 ${i % 2 === 0 ? "animate-pulse" : ""}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 1.1 }}
            >
              <img
                src={image}
                alt={`Pattern ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </motion.div>
        <motion.h2
          className="text-2xl font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="text-base-content/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {subtitle}
        </motion.p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
