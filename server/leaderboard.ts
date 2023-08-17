import { PrismaClient } from "@prisma/client";

// Response type for adding a player to the leaderboard
export type AddPlayerLeaderboardResponse = {
  success: boolean; // Indicates whether the operation was successful
};

// Type for a single entry in the leaderboard
export type LeaderboardEntry = {
  id: number;
  playerName: string;
  score: number;
  date: Date;
};

// Response type for retrieving the leaderboard
export type GetLeaderboardResponse = {
  success: boolean; // Indicates whether the operation was successful
  leaderboard: LeaderboardEntry[]; // Array of leaderboard entries
};

// Class representing the leaderboard
export class Leaderboard {
  prisma: PrismaClient;

  constructor() {
    // Initialize the Prisma client for database interactions
    this.prisma = new PrismaClient();
  }

  // Method for adding a player to the leaderboard
  async addPlayerLeaderboard(
    playerName: string,
    score: number,
    date: Date,
  ): Promise<AddPlayerLeaderboardResponse> {
    try {
      if (playerName && score && date) {
        // Insert the new player into the database
        await this.prisma.leaderboard.create({
          data: {
            playerName: playerName,
            score: score,
            date: date,
          },
        });
        return { success: true }; // Return success response
      } else {
        return {
          success: false, // If any of the required data is missing, return failure response
        };
      }
    } catch (error) {
      console.error("Database connection error", error);
      return {
        success: false, // Return failure response on error
      };
    }
  }

  // Method for retrieving the leaderboard
  async getLeaderboard(): Promise<GetLeaderboardResponse> {
    try {
      // Fetch leaderboard data from the database
      const leaderboard = await this.prisma.leaderboard.findMany();

      // Sort leaderboard entries based on score and date
      leaderboard.sort((first, second) => {
        // Sort by score in descending order
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        // If scores are equal, sort by date in descending order
        return new Date(second.date).getTime() - new Date(first.date).getTime();
      });

      return { success: true, leaderboard: leaderboard }; // Return success response with leaderboard data
    } catch (error) {
      return { success: false, leaderboard: [] }; // Return failure response if an error occurs
    }
  }
}
