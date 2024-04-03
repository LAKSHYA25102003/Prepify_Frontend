import React from "react";
import trustImage from "../../Utils/Images/trustImage.jpg";
import whyChoose from "../../Utils/Images/why-choose-us.jpg";

function TrustUs() {
  return (
    <div className="pb-10">
      <div className="mt-28 w-[100%]">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 w-[95%] md:w-[90%] mx-auto">
          <img className="border-2 rounded-3xl border-gray-400" src={trustImage}></img>
          <div className="flex flex-col justify-center gap-3">
            <div className="text-center lg:text-left font-handwritten2 font-semibold  text-5xl ">
              Trust Us
            </div>
            <div className="text-center lg:text-left font-handwritten2  text-3xl ">
              We Are Here to Help!
            </div>
            <div className="text-base font-handwritten2 font-[550] md:mx-1">
              If you are looking for a reliable mentors with whom you share your
              mind, thoughts and get the best advice you’ve been looking for, we
              are here. With years of experience in helping college students, we
              have experienced mentors, how to crack interviews of companies and
              get job in dream company. Then, what are you waiting for, checkout
              our services and book your mock interview now.
            </div>
          </div>
        </div>
      </div>
      <div className="mt-20 w-[100%]">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-[95%] md:w-[90%] mx-auto">
          <div className="flex flex-col justify-center gap-4">
            <div className="text-center lg:text-left font-handwritten2  text-5xl font-semibold">
              Why Choose Us?
            </div>
            <div className="text-center lg:text-left font-handwritten2  text-xl ">
              We are well-experienced industry professionals with brilliant
              minds.
            </div>
            <div className="text-xl font-handwritten2 font-semibold flex-col leading-relaxed ">
              <div className="text-center lg:text-left">Passion & Commitment</div>
              <div className="text-center lg:text-left">Honesty & Openness</div>
              <div className="text-center lg:text-left">Dedicated Team</div>
              <div className="text-center lg:text-left">Practical Approach</div>
            </div>
          </div>
          <img className="border-2 rounded-3xl border-gray-400" src={whyChoose}></img>
        </div>
      </div>
    </div>
  );
}

export default TrustUs;
