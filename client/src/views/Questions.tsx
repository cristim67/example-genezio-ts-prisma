import React, { useEffect, useState } from "react";
import { Button, Card, Container, Row, Col } from "reactstrap";
import { Leaderboard } from "../sdk/leaderboard.sdk";

// Function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Define the structure of a Question
interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

// Define the structure of a Leaderboard entry
interface LeaderboardInterface {
  id: number;
  playerName: string;
  score: number;
  date: Date;
}

// Enum to represent the game status
enum GameStatus {
  Loading,
  InProgress,
  Finished,
}

// Component for the Questions page
export default function Questions() {
  // State variables to manage game state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Loading);
  const [leaderboard, setLeaderboard] = useState<LeaderboardInterface[] | null>(
    null,
  );
  const [leaderboardLoaded, setLeaderboardLoaded] = useState<boolean>(false);
  const playerName = localStorage.getItem("playerName") || "";
  const selectCategory = localStorage.getItem("selectCategory") || "";
  const selectedDifficulty = localStorage.getItem("selectedDifficulty") || "";

  // Fetch questions from API based on selected options
  useEffect(() => {
    if (!playerName || !selectCategory || !selectedDifficulty) {
      console.error("Some necessary data is missing.");
      return;
    }

    const apiUrl = `https://opentdb.com/api.php?amount=10&category=${selectCategory}&difficulty=${selectedDifficulty}`;
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        const fetchedQuestions = data.results;
        const shuffledQuestions = fetchedQuestions.map((q: Question) => ({
          ...q,
          incorrect_answers: shuffleArray([
            ...q.incorrect_answers,
            q.correct_answer,
          ]),
        }));
        setQuestions(shuffledQuestions);
        setGameStatus(GameStatus.InProgress);
      })
      .catch((error) => {
        console.error("An error occurred while fetching questions:", error);
      });
  }, [playerName, selectCategory, selectedDifficulty]);

  // Fetch leaderboard data when game finishes
  useEffect(() => {
    if (gameStatus === GameStatus.Finished && !leaderboardLoaded) {
      Leaderboard.getLeaderboard()
        .then((data) => {
          setLeaderboard(data.leaderboard);
          setLeaderboardLoaded(true);
        })
        .catch((error) => {
          console.error("Error fetching leaderboard:", error);
        });
    }
  }, [gameStatus, leaderboardLoaded]);

  // Handle user's answer selection
  const handleAnswerSelection = (answer: string): void => {
    setUserAnswer(answer);
  };

  // Handle moving to the next question or finishing the game
  const handleNextQuestion = (): void => {
    if (userAnswer === questions[currentQuestionIndex].correct_answer) {
      setScore((prevScore) => prevScore + 1);
    }

    setUserAnswer(null);
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);

    // Handle game completion
    if (currentQuestionIndex >= questions.length - 1) {
      Leaderboard.addPlayerLeaderboard(playerName, score, new Date())
        .then((status) => {
          if (status) {
            setGameStatus(GameStatus.Finished);
          }
        })
        .catch((error) => {
          console.error("Error updating leaderboard:", error);
        });
    }
  };

  // Display loading message while fetching questions
  if (gameStatus === GameStatus.Loading) {
    return <div>Loading...</div>;
  }

  // Display game results or leaderboard
  if (
    gameStatus === GameStatus.Finished ||
    currentQuestionIndex >= questions.length
  ) {
    let resultComponent: JSX.Element | null = null;

    if (gameStatus === GameStatus.Finished && leaderboard) {
      const leaderboardItems = leaderboard.map((item) => (
        <div key={item.id}>
          <p>Player: {item.playerName}</p>
          <p>Score: {item.score}</p>
          <p>Date: {item.date.toString()}</p>
          <hr />
        </div>
      ));

      resultComponent = (
        <Container>
          <Row>
            <Col xs="12" md={{ size: 6, offset: 3 }}>
              <Card className="mt-5 p-4">
                <h1 className="text-center">The game is over, {playerName}!</h1>
                <p className="mt-3 text-center">Final Score: {score}</p>
                <hr />
                <div>
                  <p className="text-center">Ranking</p>
                  <div className="leaderboard">{leaderboardItems}</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      );
    } else {
      resultComponent = (
        <Container>
          <Row>
            <Col xs="12" md={{ size: 6, offset: 3 }}>
              <Card className="mt-5 p-4">
                <h1 className="text-center">The game is over, {playerName}!</h1>
                <p className="mt-3 text-center">Final Score: {score}</p>
                <hr />
                <p className="text-center">Ranking</p>
              </Card>
            </Col>
          </Row>
        </Container>
      );
    }

    if (resultComponent) {
      return resultComponent;
    } else {
      return null;
    }
  } else {
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <Container>
        <Row>
          <Col xs="12" md={{ size: 6, offset: 3 }}>
            <Card className="mt-5 p-4">
              <h2>Question {currentQuestionIndex + 1}</h2>
              <p
                dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
              ></p>
              <ul className="no-bullets">
                {currentQuestion.incorrect_answers.map((answer) => (
                  <li
                    dangerouslySetInnerHTML={{ __html: answer }}
                    key={answer}
                    onClick={() => handleAnswerSelection(answer)}
                    className={`answer-option ${
                      userAnswer === answer ? "selected" : ""
                    }`}
                  ></li>
                ))}
              </ul>
              <Button
                color="primary"
                onClick={() => {
                  handleNextQuestion();
                }}
                disabled={!userAnswer}
              >
                Next Question
              </Button>
              <p className="mt-4">Current Score: {score}</p>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}
