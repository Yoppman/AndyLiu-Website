import React from 'react';
import Quote from '../components/Quote';
import { Compare } from '../components/ui/compare';
import { Timeline } from '../components/ui/timeline';

const JourneyTimeline = () => {
  const journeyData = [
    {
      title: "June 2025",
      content: (
        <div>
          <h3 className="font-semibold text-xl mb-2">PureStorage, Santa Clara</h3>
          <p className="mb-2 text-sm font-medium text-neutral-800">Software Engineer Intern</p>
          <p className="text-xs font-normal text-neutral-700">
            Optimize write data path for enterprise distributed storage system using DSA (Data Streaming Accelerator)
          </p>
        </div>
      ),
    },
    {
      title: "2024",
      content: (
        <div>
          <h3 className="font-semibold text-xl mb-2">University of California, Irvine</h3>
          <p className="mb-2 text-sm font-medium text-neutral-800">M.S. in Embedded & Cyber‑Physical Systems</p>
          <p className="mb-4 text-xs text-neutral-600">GPA: 4.0/4.0 | Expected Dec 2025</p>
          <p className="text-xs font-normal text-neutral-700">
            Coursework: IoT Sensor and Actuator, Embedded Software, Control System
          </p>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div>
          <h3 className="font-semibold text-xl mb-2">AdvanTech, Inc</h3>
          <p className="mb-2 text-sm font-medium text-neutral-800">Software R&D Intern</p>
          <p className="text-xs font-normal text-neutral-700">
            Led development of a data augmentation module using diffusion model and deep generative models on the company's ML platform
          </p>
        </div>
      ),
    },
    {
      title: "2022",
      content: (
        <div>
          <h3 className="font-semibold text-xl mb-2">Industrial Technology Research Institute</h3>
          <p className="mb-2 text-sm font-medium text-neutral-800">Cloud Application Intern</p>
          <p className="text-xs font-normal text-neutral-700">
            Developed shell scripts to automate service deployment for Docker containers within GCP Kubernetes clusters
          </p>
        </div>
      ),
    },
    {
      title: "2018",
      content: (
        <div>
          <h3 className="font-semibold text-xl mb-2">National Yang Ming Chiao Tung University</h3>
          <p className="mb-2 text-sm font-medium text-neutral-800">B.S in Computer Science</p>
          <p className="mb-2 text-sm font-medium text-neutral-800">B.S. in Industrial Engineering & Management</p>
          <p className="text-xs text-neutral-600">GPA: 4.13/4.3</p>
        </div>
      ),
    },
    {
      title: "2015",
      content: (
        <div>
          <h3 className="font-semibold text-xl mb-2">Taipei Municipal Chien Kuo High School, CKHS</h3>
        </div>
      )
    }
  ];

  return (
    <div className="relative w-full overflow-clip">
      <Timeline data={journeyData} />
    </div>
  );
};

const About: React.FC = () => {
  return (
    <div className="pt-20">
      {/* Quote Block */}
      <Quote
        imageSrc="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747608825/za8pbhwgrg2g2wsplb56.jpg"
        text="Success is where hard work meets luck."
        author="Personal Motto"
        heightClassName="h-[400px]"
      />

      {/* About + Compare (side-by-side, Compare on right) */}
      <section className="py-20 bg-white">
        <div className="w-full px-[8vw] sm:px-[6vw] md:px-[4vw] lg:px-[4vw] xl:px-[6vw] 2xl:px-[10vw]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-32 xl:gap-24 items-center">
            <div className="px-4 lg:px-0">
              <h2 className="font-playfair text-4xl mb-8">From Taiwan to Irvine, CA</h2>
              <p className="text-xl leading-relaxed">
                I'm Chia Da Liu, a master's student in Embedded & Cyber‑Physical Systems at UC Irvine (expected Dec 2025) and soon‑to‑be Software Test Development Engineer Intern at Pure Storage. I bridge low‑level firmware and high‑level software—crafting C++ drivers, Python automation scripts, and ROS‑based robotic demos. Beyond code, I'm an avid street and travel photographer, always hunting the perfect light and angle.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end px-4 lg:px-0">
              <div className="p-6 border rounded-3xl bg-white border-neutral-200 shadow-lg">
                <Compare
                  firstImage="https://res.cloudinary.com/duo70zkqx/image/upload/v1755454381/others/dsc08410.jpg"
                  secondImage="https://res.cloudinary.com/duo70zkqx/image/upload/v1755454151/others/dsc09302.jpg"
                  firstImageClassName="object-cover object-center"
                  secondImageClassname="object-cover object-center"
                  className="h-[300px] w-[300px] md:h-[500px] md:w-[500px]"
                  slideMode="hover"
                  autoplay={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Education & Experience Timeline */}
      <section className="bg-[#f4f4f3]">
        <JourneyTimeline />
      </section>

      {/* Projects Block */}
      <section className="py-16 bg-[#f4f4f3]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-playfair text-3xl mb-10">Projects</h2>

          <div className="space-y-12">
            <div>
              <h3 className="font-semibold text-xl mb-4">GenAI Conditional Image Generation</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Enhanced the ControlNet framework by adding an input feature to manipulate character poses, significantly expanding the model's capabilities in generating diverse and complex visual outputs.</li>
                <li>Incorporated ControlNet with Dreambooth, enabling the encoding of unique identifiers in text-to-image models to recognize new subjects and styles.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-4">Real-Time Environmental Data Monitoring System</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Developed a full-stack Meteorological Platform with frontend React, backend RESTful API and Selenium crawler, working with TSMC engineers to monitor water levels, electricity loads, and seismic activities.</li>
                <li>Managed deployment on GCP by Kubernetes to 99.8% uptime and utilized Grafana for real-time monitoring.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-4">Instruction-Level Debugger</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Implemented a C debugger using the ptrace interface, enabling step-through debugging at the assembly level.</li>
                <li>Developed a 'Time Travel' feature with 30% decrease in debug time via Checkpoint/Restore In Userspace (CRIU).</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-4">Movie Recommendation System</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Utilized Matrix Factorization via ALS, item-based collaborative filtering, and achieved a 15.9% efficiency boost over the baseline KNN model.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;