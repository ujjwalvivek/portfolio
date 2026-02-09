import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BlogList from './BlogList';
import BlogPost from './BlogPost';

const Blog = () => {
  return (
    <Routes>
      <Route path="/" element={<BlogList />} />
      <Route path="/:filename" element={<BlogPost />} />
    </Routes>
  );
};

export default Blog;
