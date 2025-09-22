const Job = require('../models/Job');
const fs = require('fs');
const path = require('path');

class DatabaseService {
  constructor() {
    this.jobsFile = path.join(__dirname, '../../data/jobs.json');
    this.isMigrationComplete = false;
  }

  // Migrate existing file-based data to MongoDB
  async migrateFileDataToMongoDB() {
    try {
      console.log('🔄 Starting migration from file-based to MongoDB storage...');
      
      // Check if jobs.json exists
      if (!fs.existsSync(this.jobsFile)) {
        console.log('📁 No jobs.json file found, starting fresh with MongoDB');
        this.isMigrationComplete = true;
        return;
      }

      // Read existing jobs from file
      const fileData = fs.readFileSync(this.jobsFile, 'utf8');
      const jobsData = JSON.parse(fileData);
      
      // Handle both array and object formats
      const jobs = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
      
      if (jobs.length === 0) {
        console.log('📁 No jobs found in file, starting fresh with MongoDB');
        this.isMigrationComplete = true;
        return;
      }

      console.log(`📦 Found ${jobs.length} jobs to migrate`);

      // Migrate each job to MongoDB
      let migratedCount = 0;
      let skippedCount = 0;

      for (const job of jobs) {
        try {
          // Check if job already exists in MongoDB
          const existingJob = await Job.findOne({ id: job.id });
          
          if (existingJob) {
            console.log(`⏭️  Job ${job.id} already exists in MongoDB, skipping`);
            skippedCount++;
            continue;
          }

          // Convert file-based job to MongoDB format
          const mongoJob = new Job({
            id: job.id,
            title: job.title,
            description: job.description || '',
            address: job.address,
            pincode: job.pincode,
            budget: job.budget,
            category: job.category,
            gender: job.gender || 'Any',
            status: job.status || 'open',
            clientId: job.clientId,
            assignedFreelancer: job.assignedFreelancer || null,
            assignedAt: job.assignedAt ? new Date(job.assignedAt) : null,
            pickupMethod: job.pickupMethod || 'direct',
            workDoneAt: job.workDoneAt ? new Date(job.workDoneAt) : null,
            workDoneBy: job.workDoneBy || null,
            completedAt: job.completedAt ? new Date(job.completedAt) : null,
            offers: job.offers || [],
            paymentDetails: job.paymentDetails || null,
            createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
            updatedAt: job.updatedAt ? new Date(job.updatedAt) : new Date()
          });

          await mongoJob.save();
          console.log(`✅ Migrated job ${job.id}: ${job.title}`);
          migratedCount++;

        } catch (error) {
          console.error(`❌ Failed to migrate job ${job.id}:`, error.message);
        }
      }

      console.log(`🎉 Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
      
      // Backup the original file
      const backupFile = `${this.jobsFile}.backup.${Date.now()}`;
      fs.copyFileSync(this.jobsFile, backupFile);
      console.log(`💾 Original file backed up to: ${backupFile}`);

      this.isMigrationComplete = true;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Get all jobs from MongoDB
  async getAllJobs() {
    try {
      const jobs = await Job.find({}).sort({ createdAt: -1 });
      return jobs;
    } catch (error) {
      console.error('❌ Failed to get jobs from MongoDB:', error);
      throw error;
    }
  }

  // Delete a job from MongoDB
  async deleteJob(jobId) {
    try {
      const result = await Job.findOneAndDelete({ id: jobId });
      if (!result) {
        throw new Error('Job not found');
      }
      console.log(`🗑️ Deleted job ${jobId} from MongoDB`);
      return result;
    } catch (error) {
      console.error('❌ Failed to delete job from MongoDB:', error);
      throw error;
    }
  }

  // Get jobs by client ID
  async getJobsByClientId(clientId) {
    try {
      const jobs = await Job.find({ clientId }).sort({ createdAt: -1 });
      return jobs;
    } catch (error) {
      console.error('❌ Failed to get jobs by client ID:', error);
      throw error;
    }
  }

  // Get jobs by freelancer ID
  async getJobsByFreelancerId(freelancerId) {
    try {
      const jobs = await Job.find({ 
        'assignedFreelancer.id': freelancerId 
      }).sort({ createdAt: -1 });
      return jobs;
    } catch (error) {
      console.error('❌ Failed to get jobs by freelancer ID:', error);
      throw error;
    }
  }

  // Get job by ID
  async getJobById(jobId) {
    try {
      const job = await Job.findOne({ id: jobId });
      return job;
    } catch (error) {
      console.error('❌ Failed to get job by ID:', error);
      throw error;
    }
  }

  // Create new job
  async createJob(jobData) {
    try {
      const job = new Job(jobData);
      await job.save();
      console.log(`✅ Created job ${job.id}: ${job.title}`);
      return job;
    } catch (error) {
      console.error('❌ Failed to create job:', error);
      throw error;
    }
  }

  // Update job
  async updateJob(jobId, updateData) {
    try {
      const job = await Job.findOneAndUpdate(
        { id: jobId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
      
      if (job) {
        console.log(`✅ Updated job ${jobId}`);
      }
      
      return job;
    } catch (error) {
      console.error('❌ Failed to update job:', error);
      throw error;
    }
  }

  // Delete job
  async deleteJob(jobId) {
    try {
      const result = await Job.findOneAndDelete({ id: jobId });
      if (result) {
        console.log(`✅ Deleted job ${jobId}`);
      }
      return result;
    } catch (error) {
      console.error('❌ Failed to delete job:', error);
      throw error;
    }
  }

  // Get available jobs (open status)
  async getAvailableJobs() {
    try {
      const jobs = await Job.find({ status: 'open' }).sort({ createdAt: -1 });
      return jobs;
    } catch (error) {
      console.error('❌ Failed to get available jobs:', error);
      throw error;
    }
  }

  // Get jobs by status
  async getJobsByStatus(status) {
    try {
      const jobs = await Job.find({ status }).sort({ createdAt: -1 });
      return jobs;
    } catch (error) {
      console.error('❌ Failed to get jobs by status:', error);
      throw error;
    }
  }

  // Get job statistics
  async getJobStats() {
    try {
      const stats = await Job.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const totalJobs = await Job.countDocuments();
      
      return {
        total: totalJobs,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('❌ Failed to get job stats:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
