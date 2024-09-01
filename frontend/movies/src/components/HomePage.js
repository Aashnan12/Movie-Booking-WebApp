import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import MovieItem from "./Movies/MovieItem";
import { Link } from "react-router-dom";
import { getAllMovies } from "../api-helpers/api-helpers";
import './homepage.css';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    getAllMovies()
      .then((data) => setMovies(data.movies))
      .catch((err) => console.log(err));
  }, []);
  return (
    <Box width={"100%"} height="100%" margin="auto" marginTop={2}>
      <Box margin={"auto"} width="80%" height={"40vh"} padding={2}>
        <img
          // src="https://i.ytimg.com/vi/bweRG6WueuM/maxresdefault.jpg"
          src="https://cdn.grabon.in/gograbon/images/web-images/uploads/1618571888087/movie-ticket-offers.jpg"
          alt="book"
          width={"100%"}
          height={"100%"}
        />
      </Box>
      <Box padding={5} margin="auto">
        <Typography variant="h4" textAlign={"center"}>
          <h4>Latest Releases</h4>
        </Typography>
      </Box>
      <Box
        margin={"auto"}
        display="flex"
        width="80%"
        justifyContent={"center"}
        alignItems="center"
        flexWrap="wrap"
      >
        {movies &&
          movies
            .slice(0, 4)
            .map((movie, index) => (
              <MovieItem
                id={movie.id}
                title={movie.title}
                posterUrl={movie.posterUrl}
                releaseDate={movie.releaseDate}
                key={index}
              />
            ))}
      </Box>
      <Box display="flex" padding={5} margin="auto">
        <Button
          LinkComponent={Link}
          to="/movies"
          variant="outlined"
          sx={{ margin: "auto", color: "red" }}
        >
          <h1>View All Movies</h1>
        </Button>  
      </Box>



           <div class ="contact">
             <h3> +91-1234567890 </h3>
                <img class="whatsapp" src ="https://th.bing.com/th/id/R.24b5c5331d3737ab69b2d4e631b35596?rik=9rxLG2wT6VCazA&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fwhatsapp-png-wazapp-logo-whats-whatsapp-logo-whatsapp-icon-2050.png&ehk=Spk3ZDnOuA%2bBHep8M1XmGD7BVSPDFPev4tIe8OW694Y%3d&risl=&pid=ImgRaw&r=0"></img>
            </div>

            <div class ="contact">
             <h3>  bookyourshow@gmail.com</h3>
              <img class="whatsapp"src="https://www.pavilionweb.com/wp-content/uploads/2017/03/gmail.png"></img>
           

            </div> 
 <center>
            <p class ="reserve"> Copyright 2024 ©book your movie - All Right Reserved.</p>
 </center>       
          
  



    </Box>

  );
};

export default HomePage;
