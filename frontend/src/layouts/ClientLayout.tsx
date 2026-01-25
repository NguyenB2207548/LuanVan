import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ClientLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />{" "}
        {/* Các trang con như HomePage, ProductDetail sẽ hiện ở đây */}
      </main>
      <Footer />
    </div>
  );
};

export default ClientLayout;
