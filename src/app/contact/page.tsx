/*eslint-disable @typescript-eslint/no-explicit-any*/
"use client";

import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Mail, Phone, Clock, Send, Star } from 'lucide-react'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) error = 'This field is required';
        else if (value.length < 2) error = 'Must be at least 2 characters';
        break;
        
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
        
      case 'phone':
        if (value) {
          const cleanPhone = value.replace(/[\s\-\(\)]/g, "");
          const baseNumber = cleanPhone.replace(/^(\+91|0|91)/, '');
          
          if (baseNumber.length > 10) {
            error = 'Mobile number cannot exceed 10 digits';
          } else if (baseNumber && !/^[6-9]/.test(baseNumber)) {
            error = 'Mobile number must start with 6, 7, 8, or 9';
          } else if (baseNumber && !/^[6-9]\d{0,9}$/.test(baseNumber)) {
            error = 'Please enter a valid mobile number';
          }
        }
        break;
        
      case 'subject':
        if (!value.trim()) error = 'Subject is required';
        else if (value.length < 5) error = 'Subject must be at least 5 characters';
        break;
        
      case 'message':
        if (!value.trim()) error = 'Message is required';
        break;
        
      default:
        break;
    }
    
    return error;
  };

  const handleInputChange = (field: string, value: string) => {
    // For phone field, restrict to 10 digits only
    if (field === 'phone') {
      const cleanPhone = value.replace(/[\s\-\(\)]/g, "");
      const baseNumber = cleanPhone.replace(/^(\+91|0|91)/, '');
      
      // If user tries to enter more than 10 digits, don't update the value
      if (baseNumber.length > 10) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate on change for phone field only (real-time validation)
    if (field === 'phone') {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message)
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting.');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Message sent successfully!');
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch{
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100/50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 text-yellow-600 fill-current" />
              <span className="text-sm font-medium text-blue-800">Get In Touch</span>
              <Star className="w-4 h-4 text-yellow-600 fill-current" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
              Get In Touch
            </h1>
            <div className="inline-block mb-4">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-yellow-500 mx-auto"></div>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Have questions about our astrological programs? Reach out to our team for expert guidance and support.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Contact Form Card */}
            <Card className="lg:col-span-2 shadow-lg border-0 bg-white relative">
              {/* Yellow Border */}
              <div className="absolute left-0 top-0 w-1 h-full bg-yellow-500 rounded-l-lg"></div>
              <CardHeader className="pb-6 pl-8">
                <CardTitle className="text-2xl font-semibold text-slate-800 flex items-center gap-3">
                  <Send className="w-6 h-6 text-blue-600" />
                  Send us a Message
                </CardTitle>
                <p className="text-slate-600">
                  Fill out the form below and our team will get back to you shortly.
                </p>
              </CardHeader>
              <CardContent className="pl-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                        First Name *
                      </Label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        required 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onBlur={(e) => handleBlur('firstName', e.target.value)}
                        className={`h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.firstName ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                        Last Name *
                      </Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        required 
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onBlur={(e) => handleBlur('lastName', e.target.value)}
                        className={`h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.lastName ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address *
                    </Label>
                    <Input 
                      id="email" 
                      placeholder="john.doe@example.com" 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      className={`h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                      Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      placeholder="+91 98765 43210" 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={(e) => handleBlur('phone', e.target.value)}
                      className={`h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-slate-700">
                      Subject *
                    </Label>
                    <Input 
                      id="subject" 
                      placeholder="Course inquiry, consultation, etc." 
                      required 
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      onBlur={(e) => handleBlur('subject', e.target.value)}
                      className={`h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        errors.subject ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.subject && (
                      <p className="text-red-500 text-sm">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                      Message *
                    </Label>
                    <Textarea 
                      id="message" 
                      placeholder="Please describe your inquiry in detail..." 
                      required 
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      onBlur={(e) => handleBlur('message', e.target.value)}
                      className={`resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px] ${
                        errors.message ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm">{errors.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information & Details */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">Address</h3>
                      <p className="text-white/80 text-sm">123 Cosmic Lane, Stellar Heights</p>
                      <p className="text-white/80 text-sm">New Delhi - 110001, India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">Email</h3>
                      <p className="text-white/80 text-sm">info@futuretekastro.com</p>
                      <p className="text-white/80 text-sm">support@futuretekastro.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Phone className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">Phone</h3>
                      <p className="text-white/80 text-sm">+91 98765 43210</p>
                      <p className="text-white/80 text-sm">+91 98765 43211</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">Office Hours</h3>
                      <p className="text-white/80 text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
                      <p className="text-white/80 text-sm">Saturday: 10:00 AM - 2:00 PM</p>
                      <p className="text-white/80 text-sm">Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Response Card */}
              <Card className="shadow-lg border-0 bg-yellow-50 border-l-4 border-yellow-400">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Quick Response</h3>
                      <p className="text-yellow-800 text-sm">
                        We typically respond to all inquiries within 2-4 business hours during our office hours.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Support Card */}
              <Card className="shadow-lg border-0 bg-blue-50 border-l-4 border-blue-400">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Star className="w-5 h-5 text-blue-600 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Priority Support</h3>
                      <p className="text-blue-800 text-sm">
                        Existing students get priority support with 1-hour response time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Support Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-slate-800 mb-4">Other Ways to Connect</h2>
              <p className="text-slate-600">We&apos;re here to help you with your astrological journey.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Email Support Card */}
              <Card className="text-center border-slate-200 hover:border-blue-300 transition-colors shadow-sm relative overflow-hidden">
                {/* Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-3 text-lg">Email Support</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    24/7 email support for course-related inquiries and astrological guidance
                  </p>
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium">
                    Email Us
                  </Button>
                </CardContent>
              </Card>

              {/* Phone Support Card */}
              <Card className="text-center border-slate-200 hover:border-yellow-300 transition-colors shadow-sm relative overflow-hidden">
                {/* Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-3 text-lg">Phone Support</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    Direct consultation and personalized guidance during business hours
                  </p>
                  <Button variant="outline" size="sm" className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white font-medium">
                    Call Now
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Response Card */}
              <Card className="text-center border-slate-200 hover:border-blue-300 transition-colors shadow-sm relative overflow-hidden">
                {/* Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-3 text-lg">Quick Response</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    Fast and reliable responses to all your inquiries within business hours
                  </p>
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium">
                    Get Help
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 rounded-xl p-8 text-white relative overflow-hidden ">
            {/* Golden Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
            
            <h2 className="text-2xl font-semibold mb-3">Ready to Start Your Astrological Journey?</h2>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto">
              Join thousands of students who have transformed their lives through our comprehensive astrological courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold px-6 py-2">
                Explore Courses
              </Button>
              <Button
                variant="outline"
                className="border-white text-black hover:bg-transparent hover:text-white font-semibold px-6 py-2 transition-all duration-300"
              >
                Book Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter/>
    </>
  )
}