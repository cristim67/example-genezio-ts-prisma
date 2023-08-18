import { PrismaClient } from "@prisma/client";
import {
  AddPlayerLeaderboardResponse,
  GetLeaderboardResponse,
} from "./models/typeLeaderboard";

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
    if (!(playerName && score && date)) {
      return {
        success: false, // If any of the required data is missing, return failure response
      };
    } else {
      // Insert the new player into the database
      try {
        await this.prisma.leaderboard.create({
          data: {
            playerName: playerName,
            score: score,
            date: date,
          },
        });
        return { success: true }; // Return success response
      } catch (error) {
        console.error("Database connection error", error);
        return {
          success: false, // Return failure response on error
        };
      }
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
