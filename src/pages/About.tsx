import React from 'react';
import Quote from '../components/Quote';
import { Compare } from '../components/ui/compare';

const About: React.FC = () => {
  return (
    <div className="pt-20">
      {/* Quote Block */}
      <Quote
        imageSrc="https://images.pexels.com/photos/1738434/pexels-photo-1738434.jpeg"
        text="In every hidden corner of the earth, I honor the story woven behind the scene—not only the scene itself."
        author="Andy Liu"
        heightClassName="h-[300px]"
      />

      {/* Beautiful Text Block */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-playfair text-4xl mb-8">From Taiwan to Irvine, CA</h2>
          <p className="text-xl leading-relaxed">
            I'm Chia Da Liu, a master's student in Embedded & Cyber‑Physical Systems at UC Irvine (expected Dec 2025) and soon‑to‑be Software Test Development Engineer Intern at Pure Storage. I bridge low‑level firmware and high‑level software—crafting C++ drivers, Python automation scripts, and ROS‑based robotic demos. Beyond code, I'm an avid street and travel photographer, always hunting the perfect light and angle.
          </p>
        </div>
      </section>

      {/* Compare Component Section */}
      <section className="py-20 bg-[#f4f4f3]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-playfair text-4xl mb-12 text-center">Before & After: My Photography Journey</h2>
          <div className="flex justify-center">
            <div className="p-6 border rounded-3xl bg-white border-neutral-200 shadow-lg">
              <Compare
                firstImage="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780923/DSC03231_lh0bqs.jpg"
                secondImage="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780922/DSC03229_rlenrb.jpg"
                firstImageClassName="object-cover object-center"
                secondImageClassname="object-cover object-center"
                className="h-[300px] w-[300px] md:h-[500px] md:w-[500px]"
                slideMode="hover"
              />
            </div>
          </div>
          <p className="text-center mt-8 text-lg font-cormorant text-gray-600 max-w-2xl mx-auto">
            Hover over the image to see the transformation in my photography style and technique over time.
          </p>
        </div>
      </section>

      {/* Education Block */}
      <section className="py-16 bg-[#f4f4f3]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-playfair text-3xl mb-10">Education</h2>
          
          <div className="mb-12">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-xl">University of California, Irvine</h3>
              <span className="text-gray-600">Sept. 2024-Dec. 2025</span>
            </div>
            <p className="mb-2">M.S. in Embedded & Cyber‑Physical Systems (GPA: 4.0/4.0)</p>
            <p className="text-gray-600">Relevant coursework: IoT Sensor and Actuator, Embedded Software, Control System</p>
          </div>

          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-xl">National Yang Ming Chiao Tung University</h3>
              <span className="text-gray-600">Sept. 2018-June 2023</span>
            </div>
            <p className="mb-2">B.S in Computer Science (GPA 4.13/4.3)</p>
            <p>B.S. in Industrial Engineering & Management</p>
          </div>
        </div>
      </section>

      {/* Experience Block */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-playfair text-3xl mb-10">Experiences</h2>

          <div className="mb-12">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-xl">AdvanTech, Inc</h3>
              <span className="text-gray-600">Jun. 2023-Jan. 2024</span>
            </div>
            <p className="font-medium mb-2">Title: Software R&D Intern</p>
            <p className="text-gray-800">Led development of a data augmentation module using diffusion model and deep generative models on the company's ML platform</p>
          </div>

          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-xl">Industrial Technology Research Institute</h3>
              <span className="text-gray-600">Nov. 2022-May 2023</span>
            </div>
            <p className="font-medium mb-2">Title: Cloud Intern</p>
            <p className="text-gray-800">Developed shell scripts to automate service deployment for Docker containers within GCP Kubernetes clusters</p>
          </div>
        </div>
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